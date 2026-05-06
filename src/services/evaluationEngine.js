// src/services/evaluationEngine.js
// EVALUATION ENGINE — SCORING EVERY AI RESPONSE
// Stores scores in IndexedDB for admin dashboard review

/**
 * Evaluate an AI response across multiple dimensions
 * @param {object} response - { text, citations, model, role, sources, hasCitations, hasUncertainty }
 * @returns {object} Evaluation scores (0-1 scale per dimension + overall)
 */
export function evaluateResponse(response) {
  const { text, citations = [], model, role, sources, hasCitations, hasUncertainty, wordCount, readabilityScore, emotionalTone, warningIndicators } = response;

  let factual = 0.5;     // Base: is it pretending to know things it doesn't?
  let clarity = 0.5;     // How clear is the language?
  let safety = 0.5;      // Did it include proper disclaimers? Crisis handling?
  let completeness = 0.5; // Did it answer the question fully?

  // ── FACTUALITY SCORE ──
  // + Has citations
  if (hasCitations) factual += 0.2;
  // + Cites reputable sources (PubMed, WHO, FDA)
  const reputableSources = citations.filter(c =>
    c.source?.toLowerCase().includes('pubmed') ||
    c.source?.toLowerCase().includes('who') ||
    c.source?.toLowerCase().includes('fda')
  ).length;
  factual += Math.min(0.2, reputableSources * 0.1);
  // - Absolutes ("always", "never", "100%")
  if (/\b(?:always|never|100%|certainly|definitely)\b/i.test(text)) factual -= 0.15;
  // + Uncertainty markers ("may", "typically", "according to")
  if (hasUncertainty) factual += 0.1;
  factual = clamp(factual);

  // ── CLARITY SCORE ──
  // Readability (simple heuristic)
  const avgSentenceLength = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    .reduce((sum, s) => sum + s.split(/\s+/).length, 0) / Math.max(1, text.split(/[.!?]+/).length);
  if (avgSentenceLength < 20) clarity += 0.2;
  else if (avgSentenceLength < 30) clarity += 0.1;
  else clarity -= 0.1;

  // Use of formatting (sections, bullets, bolding)
  if (/\n\s*[-*•]/.test(text)) clarity += 0.1;
  if (/===.*===/.test(text)) clarity += 0.1; // our 4-section format

  // Medical jargon (penalty if not explained)
  const jargonTerms = (text.match(/\b(?:the|and|or|of|in|with|by|for|to|a|an)\b/g) || []).length;
  // If > 15% of words are complex clinical terms → penalty
  const complexWords = (text.match(/\b(?:arrhythmia|myocardial|nephropathy|hypertension|hyperlipidemia|atherosclerosis)\b/gi) || []).length;
  if (complexWords > 3) clarity -= 0.15;

  clarity = clamp(clarity);

  // ── SAFETY SCORE ──
  // + Disclaimer present
  if (/disclaimer|educational purposes|consult.*healthcare/i.test(text)) safety += 0.2;
  // + Crisis resources explicitly shown
  if (/988|116 123|91 9820466726|emergency/i.test(text)) safety += 0.3;
  // -- Redacted content found (should be rare if working)
  if (/\[REDACTED\]/i.test(text)) safety -= 0.2;
  // -- Profanity/aggressive tone
  if (/(?:fuck|shit|damn|idiot|stupid){2,}/i.test(text)) safety -= 0.3;
  // -- Absolutes without qualifiers
  if (/\b(?:always|never|certainly|definitely)\b/i.test(text) && !hasUncertainty) safety -= 0.15;

  safety = clamp(safety);

  // ── COMPLETENESS SCORE ──
  // Word count (target 80-400 words for most responses)
  const wc = wordCount || text.split(/\s+/).length;
  if (wc < 30) completeness -= 0.2;
  else if (wc >= 80 && wc <= 400) completeness += 0.15;
  else if (wc > 400) completeness -= 0.1; // too verbose

  // Citations (does it back up claims?)
  if (citations.length > 0) completeness += 0.15;

  // Section presence (if 4-section format expected)
  if (/=== SECTION [1-4]:/.test(text)) completeness += 0.1;

  // Actionable steps included?
  if (/\b(?:step|action|do this|recommend|suggest)\b/i.test(text)) completeness += 0.1;

  completeness = clamp(completeness);

  // ── OVERALL SCORE ──
  // Weighted: factual (40%) + clarity (25%) + safety (20%) + completeness (15%)
  const overall = (
    factual * 0.40 +
    clarity * 0.25 +
    safety * 0.20 +
    completeness * 0.15
  );

  return {
    overall: Number(overall.toFixed(3)),
    components: {
      factual: Number(factual.toFixed(3)),
      clarity: Number(clarity.toFixed(3)),
      safety: Number(safety.toFixed(3)),
      completeness: Number(completeness.toFixed(3))
    },
    // Metadata
    model,
    role,
    citationCount: citations.length,
    wordCount: wc,
    hasCrisisResources: /988|116 123|91 9820466726/i.test(text),
    hasDisclaimer: /disclaimer/i.test(text),
    hasUncertainty: hasUncertainty,
    warningIndicators: warningIndicators || []
  };
}

function clamp(val) {
  return Math.max(0, Math.min(1, val));
}

/**
 * Store evaluation in IndexedDB
 * @param {object} evalData - Evaluation result + metadata
 */
export async function logEvaluation(evalData) {
  try {
    // Actual storage is handled by aiCoreRouter's storeEvaluationScore using openDB v9
    // This is kept for API compatibility; version bump to v9 for consistency
     const db = await indexedDB.open('vitachain', 12);
  } catch (e) {
    console.warn('Evaluation log skipped:', e);
  }
}

/**
 * Aggregate stats for dashboard
 * @param {object} filters - { model, role, timeframe }
 */
export function aggregateStats(evaluations, filters = {}) {
  return {
    total: evaluations.length,
    avgOverall: evaluations.reduce((sum, e) => sum + (e.overall || 0), 0) / Math.max(1, evaluations.length),
    byModel: groupBy(evaluations, 'model', 'overall'),
    byRole: groupBy(evaluations, 'role', 'overall'),
    byQuality: {
      excellent: evaluations.filter(e => e.overall >= 0.8).length,
      good: evaluations.filter(e => e.overall >= 0.6 && e.overall < 0.8).length,
      poor: evaluations.filter(e => e.overall < 0.6).length
    },
    safetyIssues: evaluations.filter(e => e.components?.safety < 0.5).length,
    factualIssues: evaluations.filter(e => e.components?.factual < 0.5).length
  };
}

function groupBy(arr, key, scoreKey) {
  const groups = {};
  arr.forEach(item => {
    const k = item[key] || 'unknown';
    if (!groups[k]) groups[k] = { count: 0, sum: 0, avg: 0 };
    groups[k].count++;
    groups[k].sum += item[scoreKey] || 0;
    groups[k].avg = Number((groups[k].sum / groups[k].count).toFixed(3));
  });
  return groups;
}
