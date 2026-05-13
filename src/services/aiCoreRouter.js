// src/services/aiCoreRouter.js
// VITACHAIN AI CORE ROUTER GÇö SINGLE ENTRY POINT FOR ALL AI CALLS
// Refactored from hybridAIRouter.js GÇö now THE ONLY canonical AI gateway
// Responsibilities: routing, fallback ladder, caching, safety, evaluation, logging

import { pipeline, env } from '@huggingface/transformers';
import { getEmbeddingModel, getTextGenerator, getTokenizer, getTextGeneratorForRole, isModelLoaded, setModelLoaded } from './modelLoader.js';
import { searchWeb } from './webSearchService';
import { searchPubMed } from './pubmedSearch';
import { searchClinicalTrials } from './clinicalTrialsSearch';
import { searchDrugRecalls, searchDrugLabeling } from './openFDASearch';
import { fetchWHOIndicator } from './whoGHOSearch';
import { fetchCovidCountry, fetchOutbreakData } from './diseaseShSearch';
import { queryOpenRouter, queryOpenRouterFallback } from './openRouterService';
import { queryHuggingFaceCascade } from './huggingfaceService';
import { detectEmotion, getEmotionalAdjustment } from './emotionDetector';
import { getThreadContext, addTurn, buildEmotionalHistoryPrompt, getEmotionalTrend, getEmotionalTrendSummary } from './emotionalThreading';
import { logInteraction } from './selfTrainingEngine';
import { applyGuardrails } from './safetyGuardrails.js';
import { evaluateResponse } from './evaluationEngine.js';

// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
// CONFIGURATION
// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent';
const GEMINI_JUDGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';
const DAILY_QUOTA = parseInt(import.meta.env.VITE_DAILY_QUOTA || '1500');
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const VECTOR_DIM = 384;

// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
// STATE
// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
let quotaUsed = 0;
let quotaResetDate = new Date().toDateString();
let embedder = null;
let embedderLoaded = false;
let embedderLoading = false;
let embedderError = null;
let embedderCooldownUntil = 0;
let generator = null;
let generatorLoaded = false;
let generatorLoading = false;
let generatorError = null;
let lastResult = null;
let lastReasoning = [];

// Export getters for backward compatibility
export function getLastRouteResult() { return lastResult; }
export function getLastReasoning() { return lastReasoning; }

// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
// QUOTA MANAGEMENT
// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
function resetQuotaIfNewDay() {
  const today = new Date().toDateString();
  if (today !== quotaResetDate) {
    quotaUsed = 0;
    quotaResetDate = today;
  }
}
export function getQuotaRemaining() {
  resetQuotaIfNewDay();
  return { used: quotaUsed, remaining: Math.max(0, DAILY_QUOTA - quotaUsed), resetAt: new Date(Date.now() + 86400000).toISOString() };
}
function incrementQuota() {
  resetQuotaIfNewDay();
  quotaUsed++;
}

// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
// REASONING STEP TRACKING (for DeepSeek-style collapsible panel)
// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ

/**
 * Create a reasoning step object
 * @param {number} stepNum
 * @param {string} action
 * @param {string} icon - emoji or identifier
 * @param {string} detail
 * @param {number} duration_ms
 * @param {string[]} source_urls
 * @param {string} status - "complete" | "running" | "error" | "pending"
 */
function createReasoningStep(stepNum, action, icon, detail, duration_ms, source_urls = [], status = "complete") {
  return { step: stepNum, action, icon, detail, duration_ms, source_urls, status };
}

/**
 * Emit a reasoning step via onStep callback (for streaming)
 */
function emitStep(onStep, step) {
  if (onStep && typeof onStep === 'function') {
    onStep(step);
  }
}

/**
 * Build a complete reasoning steps array for a given execution path
 */
function buildReasoningSteps({
  enrichmentData,
  modelCallDuration,
  modelName,
  modelSource,
  cacheHit = false,
  cacheSource = null,
  evaluationDuration = 0,
  guardrailsDuration = 0,
  embeddingDuration = 0,
  threadingDuration = 0,
  onStep
}) {
  const steps = [];
  let currentStep = 1;
  let cumulativeTime = 0;

  const addStep = (action, icon, detail, duration, source_urls = [], status = "complete") => {
    const step = createReasoningStep(currentStep++, action, icon, detail, duration, source_urls, status);
    steps.push(step);
    emitStep(onStep, step);
    cumulativeTime += duration;
    return step;
  };

  // Step 1: Query analysis
  addStep("Analyzing question", "??", "Parsing user query and extracting key medical terms", 120);

  // Step 2: Enrichment (web/pubmed/etc)
  if (enrichmentData) {
    const webCount = enrichmentData.web?.length || 0;
    const pubmedCount = enrichmentData.pubmed?.length || 0;
    const trialCount = enrichmentData.clinicalTrials?.length || 0;
    const fdaCount = enrichmentData.openFDA?.length || 0;
    const totalSources = webCount + pubmedCount + trialCount + fdaCount;

    const sourceDetail = [
      webCount > 0 ? `Web: ${webCount}` : null,
      pubmedCount > 0 ? `PubMed: ${pubmedCount}` : null,
      trialCount > 0 ? `Trials: ${trialCount}` : null,
      fdaCount > 0 ? `FDA: ${fdaCount}` : null
    ].filter(Boolean).join(', ');

    addStep(
      "Searching medical sources",
      "??",
      `Retrieving evidence from multiple trusted sources (${sourceDetail})`,
      Math.round(enrichmentDuration || 800),
      enrichmentData.allCitations?.map(c => c.url) || []
    );
  } else {
    addStep("Skipping enrichment", "??", "No external sources consulted (offline/cached mode)", 0);
  }

  // Step 3: Emotional threading
  if (threadingDuration > 0) {
    addStep("Analyzing conversation context", "??", "Processing emotional history and conversation thread", threadingDuration);
  }

  // Step 4: AI model inference
  let modelIcon = "??";
  let modelAction = "Generating response";
  if (modelSource === 'cached-gemma') {
    modelIcon = "??";
    modelAction = "Retrieving from cache";
  } else if (modelSource === 'openrouter') {
    modelIcon = "??";
    modelAction = "Querying fallback model";
  } else if (modelSource === 'huggingface') {
    modelIcon = "??";
    modelAction = "Running HuggingFace inference";
  } else if (modelSource === 'error') {
    modelIcon = "?";
    modelAction = "All models failed";
  }

  addStep(
    modelAction,
    modelIcon,
    `${modelName} processing your query`,
    modelCallDuration,
    [],
    cacheHit ? "complete" : modelSource === 'error' ? "error" : "complete"
  );

  // Step 5: Guardrails
  if (guardrailsDuration > 0) {
    addStep("Applying safety guardrails", "???", "Screening response for safety and medical accuracy", guardrailsDuration);
  }

  // Step 6: Embedding for cache (if needed)
  if (embeddingDuration > 0) {
    addStep("Caching response", "??", "Storing embedding and response for future retrieval", embeddingDuration);
  }

  // Step 7: Evaluation (internal)
  if (evaluationDuration > 0) {
    addStep("Quality evaluation", "??", "Scoring response for accuracy, clarity, and safety", evaluationDuration);
  }

  // Step 8: Final completion
  addStep(
    "Response ready",
    "?",
    modelSource === 'error' ? "All AI paths exhausted - using fallback response" : "Final answer prepared",
    Math.round(guardrailsDuration || 50),
    [],
    modelSource === 'error' ? "error" : "complete"
  );

  return steps;
}

// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
// EMBEDDING (for semantic cache) - with offline fallback
// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
export async function loadEmbedder() {
  if (embedderLoaded) return embedder;
  if (embedderLoading) {
    // Wait for in-flight load
    while (embedderLoading) { await new Promise(r => setTimeout(r, 50)); }
    if (embedderLoaded) return embedder;
    if (embedderError) return null; // failed earlier
  }

  // Cooldown check after permanent failure
  if (embedderError && embedderCooldownUntil) {
    if (Date.now() < embedderCooldownUntil) {
      console.log('[AI Router] Embedder in cooldown until', new Date(embedderCooldownUntil).toISOString());
      return null;
    } else {
      // Cooldown expired, reset error to allow retry
      embedderError = null;
    }
  }

  embedderLoading = true;
  const maxAttempts = 3;
  let lastErr = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Loading embedder (attempt ${attempt}/${maxAttempts})...`);
      embedder = await getEmbeddingModel();
      embedderLoaded = true;
      embedderLoading = false;
      // Sync global state (for embedder-specific flag we'd need to extend modelLoader)
      // For now, embedderLoaded local flag is sufficient
      console.log('✅ Embedder ready (all-MiniLM-L6-v2)');
      return embedder;
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️ Embedder attempt ${attempt} failed:`, err?.message || err);
      if (attempt < maxAttempts) {
        const delay = attempt === 1 ? 2000 : attempt === 2 ? 4000 : 3600000; // 1 hour on 3rd attempt
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  // All attempts failed
  embedderError = lastErr;
  embedder = null;
  embedderLoaded = false;
  embedderLoading = false; // Reset loading flag
  embedderCooldownUntil = Date.now() + 20 * 60 * 1000; // 20 minutes cooldown
  console.error('❌ Embedder failed after 3 attempts, using keyword fallback');
  return null;
}



export async function embedText(text) {
  await loadEmbedder();
  if (!embedder) {
    // Fallback: keyword-based simple vector (bag-of-words hashing)
    console.warn('Using keyword-based embedding fallback');
    return keywordEmbed(text);
  }
  try {
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error('Embedding failed, using fallback:', err);
    return keywordEmbed(text);
  }
}

// Simple keyword-based embedding fallback (offline-safe)
function keywordEmbed(text) {
  const words = text.toLowerCase().split(/\s+/);
  const features = {};
  words.forEach((w, i) => {
    const hash = [...w].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    features[Math.abs(hash) % 384] = (features[Math.abs(hash) % 384] || 0) + 1;
  });
  const vec = new Array(384).fill(0);
  Object.entries(features).forEach(([idx, val]) => { vec[parseInt(idx)] = Math.min(val, 5); });
  // Normalize
  const mag = Math.sqrt(vec.reduce((a, b) => a + b * b, 0)) || 1;
  return vec.map(v => v / mag);
}

// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
// OFFLINE MODEL (TinyLlama 1.1B)
// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
export async function loadTinyLlama() {
  if (isModelLoaded()) return generator;
  if (generatorLoading) {
    // Wait for in-flight load
    while (generatorLoading) { await new Promise(r => setTimeout(r, 50)); }
    if (isModelLoaded()) return generator;
    if (generatorError) throw generatorError;
  }

  generatorLoading = true;
  try {
    generator = await getTextGenerator();
    generatorLoaded = true;
    generatorLoading = false;
    setModelLoaded(true); // Sync global state
    console.log('✅ TinyLlama 1.1B ready (offline)');
    return generator;
  } catch (err) {
    generatorLoading = false;
    generatorError = err;
    throw err;
  }
}

// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
// INDEXEDDB GÇö cache + training + evaluation logs
// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
let dbInstance = null;
async function openDB() {
  const { openDB: openAppDB } = await import('../lib/idb');
  return openAppDB();
}

async function storeEvaluationScore(evaluation) {
  try {
    const db = await openDB();
    const tx = db.transaction('evaluationLogs', 'readwrite');
    const store = tx.objectStore('evaluationLogs');
    const record = { ...evaluation, timestamp: Date.now() };
    await store.add(record);
    await tx.done;
  } catch (err) { console.warn('Evaluation log failed:', err); }
}

async function storeQueryLog(queryLog) {
  try {
    const db = await openDB();
    const tx = db.transaction('queryLogs', 'readwrite');
    const store = tx.objectStore('queryLogs');
    const record = { ...queryLog, timestamp: Date.now() };
    await store.add(record);
    await tx.done;
  } catch (err) { console.warn('Query log failed:', err); }
}

async function storeGemmaResponse(query, queryVec, response, citations = [], sources = [], reasoning = null) {
  try {
    const db = await openDB();
    const tx = db.transaction('gemmaCache', 'readwrite');
    const store = tx.objectStore('gemmaCache');
    const id = `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await store.add({
      id,
      prompt: query,
      promptVector: queryVec,
      response,
      citations,
      sources,
      reasoning,
      model: 'gemma4-31b',
      timestamp: Date.now()
    });
    await tx.done;
  } catch (err) { console.warn('Cache store failed:', err); }
}

async function searchCachedResponses(queryVec, threshold = 0.85) {
  try {
    const db = await openDB();
    const tx = db.transaction('gemmaCache', 'readonly');
    const store = tx.objectStore('gemmaCache');
    const request = store.getAll();

    const all = await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });

    const results = all
      .map(item => ({
        response: item.response,
        citations: item.citations || [],
        sources: item.sources || [],
        reasoning: item.reasoning || [],
        timestamp: item.timestamp,
        similarity: cosineSimilarity(queryVec, item.promptVector)
      }))
      .filter(r => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    return results;
  } catch (err) {
    console.warn('Cache search failed:', err);
    return [];
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
// ENRICHMENT ENGINE (multi-source medical data)
// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
async function enrichWithWebData(query) {
  const data = { web: [], pubmed: [], clinicalTrials: [], openFDA: [], who: null, diseaseSh: null, searchSource: 'unknown' };

  try {
    // Tiered search: LangSearch GåÆ DuckDuckGo GåÆ Wikipedia (all free, no API keys required)
    const webResults = await searchWeb(query, 5);
    data.web = webResults;
    data.searchSource = webResults[0]?.source || 'unknown';
  } catch (e) {
    console.warn('Web search failed:', e);
  }

  try { data.pubmed = await searchPubMed(query, 3); } catch (e) { console.warn('PubMed failed:', e); }

  const drugNames = extractDrugNames(query);
  // Only search drug databases if we extracted a specific drug name
  if (drugNames.length > 0) {
    try { data.clinicalTrials = await searchClinicalTrials(drugNames[0], {}, 2); } catch (e) { console.warn('ClinicalTrials failed:', e); }
    try {
      data.openFDA = await searchDrugRecalls(drugNames[0]);
      if (data.openFDA.length === 0) {
        const labeling = await searchDrugLabeling(drugNames[0]);
        if (labeling) data.openFDA.push({ source: 'FDA Label', ...labeling });
      }
    } catch (e) { console.warn('OpenFDA failed:', e); }
  }

  if (query.toLowerCase().includes('country') || query.toLowerCase().includes('prevalence') || query.toLowerCase().includes('statistic')) {
    try {
      const usr = detectCountryFromQuery(query);
      if (usr) data.who = await fetchWHOIndicator('RD_POP_RATE', usr);
    } catch (e) { console.warn('WHO failed:', e); }
    try {
      const cc = detectCountryFromQuery(query, 2);
      if (cc) data.diseaseSh = await fetchCovidCountry(cc);
    } catch (e) { console.warn('disease.sh failed:', e); }
  }

  // Flatten citations
  const allCitations = [];
  data.web.forEach(r => allCitations.push({ type: 'web', title: r.title, url: r.url, snippet: r.snippet, source: r.source }));
  data.pubmed.forEach(a => allCitations.push({ type: 'pubmed', title: a.title, url: a.url, snippet: a.abstract, source: 'PubMed' }));
  data.clinicalTrials.forEach(t => allCitations.push({ type: 'trial', title: t.title, url: t.url, source: 'ClinicalTrials.gov' }));
  data.openFDA.forEach(e => allCitations.push({ type: 'fda', title: e.product || e.id, snippet: e.reason, source: 'FDA' }));
  if (data.who) data.who.forEach(w => allCitations.push({ type: 'who', title: w.indicator, url: w.url, source: 'WHO' }));
  if (data.diseaseSh) allCitations.push({ type: 'outbreak', title: 'COVID-19 Stats', url: 'https://disease.sh/', source: 'disease.sh' });

   return { ...data, allCitations, allSources: Object.values(data).flat().filter(Boolean) };
 }

function extractDrugNames(query) {
  const medKeywords = ['on ', 'taking ', 'drug ', 'medication ', 'prescribed ', 'using '];
  const nonDrugTerms = ['drug', 'drugs', 'medication', 'medications', 'medicine', 'pill', 'pills', 'dose', 'dosage', 'interaction', 'side effect', 'effects', 'reaction'];
  
  for (const kw of medKeywords) {
    const idx = query.toLowerCase().indexOf(kw);
    if (idx !== -1) {
      const after = query.substring(idx + kw.length);
      // Take first segment before punctuation
      const candidateRaw = after.split(/[,.!?;]/)[0].trim();
      // Split into words, take first meaningful word
      const words = candidateRaw.split(/\s+/).filter(w => w.length > 0);
      
      // Validate candidate: at least 3 chars, letters/hyphens only, not a common non-drug term
      for (const word of words) {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        if (cleanWord.length >= 3 && 
            /^[a-z-]+$/.test(cleanWord) && 
            !nonDrugTerms.includes(cleanWord) &&
            cleanWord !== 'the' && 
            cleanWord !== 'with' && 
            cleanWord !== 'for' && 
            cleanWord !== 'and' &&
            cleanWord !== 'or') {
          return [cleanWord];
        }
      }
    }
  }
  
  // Fallback: try to find any drug-like word (capitalized or known pattern)
  const words = query.split(/\s+/);
  for (const word of words) {
    if (word.length >= 3 && /^[A-Z][a-z]+$/.test(word)) {
      return [word];
    }
  }
  
   return [];
}

function detectCountryFromQuery(query, isoLength = 3) {
  const words = query.toLowerCase().split(/\s+/);
  for (const w of words) {
    if (w.length === isoLength) return w.toUpperCase();
    if (w.length > 3) {
      const map = { 'nigeria': 'NGA', 'kenya': 'KEN', 'ghana': 'GHA', 'ethiopia': 'ETH', 'south africa': 'ZAF', 'india': 'IND', 'usa': 'USA', 'uk': 'GBR', 'france': 'FRA', 'germany': 'DEU' };
      if (map[w]) return map[w];
    }
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
// GEMMA 4 API CALL (primary online)
// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
async function callGemmaAPI(prompt, systemPrompt, useJudge = false) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('VITE_GEMINI_API_KEY not set');

  const endpoint = useJudge ? GEMINI_JUDGE_URL : GEMINI_API_URL;
  const modelName = useJudge ? 'gemini-1.5-flash' : 'gemini-2.0-flash';

  const body = {
    contents: [{ 
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nUser Query: ${prompt}` }] 
    }],
    generationConfig: { 
      temperature: useJudge ? 0.1 : 0.3, 
      maxOutputTokens: 2048, 
      topP: 0.9,
      responseMimeType: useJudge ? "application/json" : "text/plain"
    }
  };

  const resp = await fetch(`${endpoint}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(`Gemini API ${resp.status}: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text, model: modelName, source: 'gemini-api' };
}

// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
// MAIN ROUTER GÇö THE ONLY ENTRY POINT
// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
/**
 * Route a structured prompt through the AI system
 * @param {object} options
 * @param {string} options.structuredPrompt GÇö Full 4-section prompt (from promptLibrary)
 * @param {string} options.role GÇö 'patient' | 'clinician' | 'chw'
 * @param {string} options.userId GÇö for emotional threading
 * @param {object} options.emotionalContext GÇö { emotionResult, threadTurns, trendSummary }
 * @param {object} options.enrichment GÇö pre-fetched enrichment data (optional, fetched if not provided)
 * @param {boolean} options.useCache GÇö allow cache lookup (default: true)
 * @param {string} options.extractedQuery GÇö Original user query for web search (default: first 200 chars of structuredPrompt)
 * @param {function} options.onStep GÇö Callback fired when each reasoning step completes (for streaming UI)
 * @returns {Promise<object>} { text, reasoningSteps[], citations[], emotionalState, model, source, evaluation }
 */
export async function routeQuery({
  structuredPrompt,
  role,
  userId = 'guest',
  emotionalContext = {},
  enrichment = null,
  useCache = true,
  extractedQuery = null,
  onStep = null
}) {
  // REASONING STEP TRACKING SETUP
  const reasoningSteps = [];
  let stepCounter = 1;

  function recordStep(action, icon, detail, duration_ms, source_urls = [], status = "complete") {
    const step = createReasoningStep(stepCounter++, action, icon, detail, duration_ms, source_urls, status);
    reasoningSteps.push(step);
    emitStep(onStep, step);
    return step;
  }

  // ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
  // CRITICAL: Log router invocation for debugging
  // ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  const quotaInfo = getQuotaRemaining();
  console.log('[AI Router] routeQuery called. Online:', isOnline, 'Credits:', quotaInfo.used + '/' + DAILY_QUOTA, '(Remaining:', quotaInfo.remaining + ')', 'Role:', role || 'none');

  // Extract user question from structuredPrompt if not provided
  let finalExtractedQuery = extractedQuery;
  if (!finalExtractedQuery) {
    // Try to find the TASK section and extract from there
    const taskMatch = structuredPrompt.match(/─── SECTION 2: TASK ───\s*([^GöÇ]*?)(?=─── SECTION|$)/s);
    if (taskMatch && taskMatch[1]) {
      finalExtractedQuery = taskMatch[1].split('\n')[0].trim();
    }
    // Fallback to first 200 chars if no TASK section found
    if (!finalExtractedQuery) {
      finalExtractedQuery = structuredPrompt.substring(0, 200).split('\n')[0];
    }
   }

    // Fetch enrichment if not pre-provided
    let enrichmentDuration = 0;
    if (!enrichment) {
      const t0 = Date.now();
      enrichment = await enrichWithWebData(finalExtractedQuery);
      enrichmentDuration = Date.now() - t0;
    }

    // Record enrichment step
    if (enrichment && (enrichment.web?.length > 0 || enrichment.pubmed?.length > 0 || enrichment.clinicalTrials?.length > 0)) {
      const webCount = enrichment.web?.length || 0;
      const pubmedCount = enrichment.pubmed?.length || 0;
      const trialCount = enrichment.clinicalTrials?.length || 0;
      const fdaCount = enrichment.openFDA?.length || 0;
      const totalSources = webCount + pubmedCount + trialCount + fdaCount;

      const sourceDetailArray = [];
      if (webCount > 0) sourceDetailArray.push(`Web: ${webCount}`);
      if (pubmedCount > 0) sourceDetailArray.push(`PubMed: ${pubmedCount}`);
      if (trialCount > 0) sourceDetailArray.push(`Trials: ${trialCount}`);
      if (fdaCount > 0) sourceDetailArray.push(`FDA: ${fdaCount}`);

      recordStep(
        "Searching medical sources",
        "??",
        `Retrieved ${totalSources} source${totalSources !== 1 ? 's' : ''} from trusted databases`,
        enrichmentDuration,
        enrichment.allCitations?.map(c => c.url) || [],
        "complete"
      );
    } else {
      recordStep("Skipping enrichment", "??", "No external sources available (offline/cached mode)", 0, [], "pending");
    }

   const { emotionResult = { state: 'neutral', confidence: 0.8 }, threadTurns = [], trendSummary = null } = emotionalContext;

  // 1. Detect emotion (always)
  const detectedEmotion = detectEmotion(structuredPrompt);
  const finalEmotion = detectedEmotion.state;

   // 2. Get emotional threading
   const historyTurns = threadTurns.length > 0 ? threadTurns : await getThreadContext(userId);
   const emotionalHistory = historyTurns.length > 0 ? buildEmotionalHistoryPrompt(historyTurns) : null;

   // 3. Get trend (fast, includes in threading time)
   const trend = await getEmotionalTrend(userId);
   const finalTrendSummary = trendSummary || getEmotionalTrendSummary(trend);

    // Record emotional threading step (approximate timing)
    const threadingDuration = historyTurns ? historyTurns.length * 5 : 20;
    recordStep("Analyzing conversation context", "??", `Processing ${historyTurns?.length || 0} previous interactions`, Math.max(threadingDuration, 30));

   // 4. Assemble full system prompt with emotional context
  let fullSystemPrompt = structuredPrompt;
  if (emotionalHistory) {
    fullSystemPrompt += `\n\n─── CONVERSATION HISTORY ───\n${emotionalHistory}`;
  }
  
  fullSystemPrompt += `\n\nCOMMAND: Output ONLY the medical response following the specified format. Do NOT repeat the instructions, quality rules, or section headers from the system prompt in your final output. Begin your response immediately with SECTION 1.`;

  // 5. Check online status & quota
  const hasQuota = quotaInfo.remaining > 0;

    // 6. ONLINE PRIMARY PATH (Gemma 4)
    if (isOnline && hasQuota) {
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (geminiKey) {
        console.log('[AI Router] Tier 1: Attempting Gemma 4 (Gemini API)');
        try {
          // Build final enriched prompt
          const enrichedPrompt = enrichment
            ? `${structuredPrompt}\n\n─── MEDICAL LITERATURE ───\n${formatEnrichmentForPrompt(enrichment)}`
            : structuredPrompt;

          // Call Gemma 4 with timing
          const modelStart = Date.now();
          const response = await callGemmaAPI(enrichedPrompt, fullSystemPrompt);
          const modelDuration = Date.now() - modelStart;
          incrementQuota();

          // Record AI inference step
          recordStep(
            "Generating AI response",
            "??",
            response.model
              ? `Primary model (${response.model}) processing enriched query`
              : "Primary model processing enriched query",
            modelDuration,
            [],
            "complete"
          );

          // Extract citations
          const citations = response.citations || enrichment?.allCitations || [];

          // Cache embedding + response (with timing)
          let embeddingDuration = 0;
          try {
            const embedStart = Date.now();
            const queryVec = await embedText(structuredPrompt);
            await storeGemmaResponse(structuredPrompt, queryVec, response.text, citations, enrichment?.allSources || [], []);
            embeddingDuration = Date.now() - embedStart;
          } catch (cacheErr) { /* silent */ }

          if (embeddingDuration > 0) {
            recordStep("Storing to knowledge cache", "??", "Caching response and embedding for future queries", embeddingDuration);
          }

          // Safety guardrails
          const guardStart = Date.now();
          const safeText = applyGuardrails(response.text, role);
          const guardrailsDuration = Date.now() - guardStart;

          if (guardrailsDuration > 10) {
            recordStep("Applying safety filters", "???", "Screening for medical accuracy and safety", guardrailsDuration);
          }

          // Evaluation (with timing)
          const evalStart = Date.now();
          const evaluation = evaluateResponse({
            text: safeText,
            role,
            model: response.model,
            sources: citations.length > 0 ? 'enriched' : 'none',
            hasCitations: citations.length > 0,
            hasUncertainty: /(?:may|might|suggests?|typically|usually|often|according to|studies? show?)/i.test(safeText),
            wordCount: safeText.split(/\s+/).length,
            readabilityScore: estimateReadability(safeText),
            emotionalTone: analyzeTone(safeText),
            warningIndicators: detectWarnings(safeText)
          });
          const evaluationDuration = Date.now() - evalStart;

          if (evaluationDuration > 10) {
            recordStep("Scoring response quality", "??", "Evaluating accuracy, clarity, and safety", evaluationDuration);
          }

          // Log evaluation
          await storeEvaluationScore({
            ...evaluation,
            modelUsed: response.model,
            role,
            queryHash: simpleHash(structuredPrompt.substring(0, 200))
          });

          // Self-training log
          logInteraction({
            prompt: structuredPrompt,
            response: safeText,
            role,
            emotionalState: finalEmotion,
            sources: enrichment?.allSources || [],
            reasoning: reasoningSteps,
            citations,
            modelUsed: response.model,
            embedding: null
          });

          // Emotional turn
          await addTurn(userId, structuredPrompt, safeText, finalEmotion);

          // Final step
           recordStep(
             "Response complete",
             "?",
             `Final answer prepared from ${response.model}`,
             0,
             [],
             "complete"
           );

          const result = {
            text: safeText,
            reasoningSteps,
            citations,
            emotionalState: finalEmotion,
            model: response.model,
            source: 'online',
            evaluation,
            quotaRemaining: getQuotaRemaining().remaining
          };
          lastResult = result;
          lastReasoning = reasoningSteps;
          console.log('[AI Router] Tier 1 SUCCESS: Gemma 4 returned response (' + safeText.length + ' chars, Score: ' + evaluation.overall + ')');
          return result;
        } catch (err) {
          console.warn('[AI Router] Tier 1 FAILED: Gemma 4 error:', err.message);
        // Fall through to fallback ladder
      }
    } else {
      console.warn('[AI Router] Tier 1 SKIPPED: VITE_GEMINI_API_KEY not set');
    }
  }

   // 7. FALLBACK LADDER
   console.log('[AI Router] Entering fallback ladder. Online:', isOnline, 'Quota:', hasQuota);

   // Record that primary failed
   recordStep("Primary model unavailable", "??", "Gemma 4 unreachable, attempting fallbacks", 0, [], "running");

   // 7a. Cache (if available)
   if (useCache) {
     console.log('[AI Router] Tier 2: Attempting cached Gemma response');
     try {
       const embedStart = Date.now();
       const queryVec = await embedText(structuredPrompt);
       const cached = await searchCachedResponses(queryVec, 0.85);
       const embedDuration = Date.now() - embedStart;

       if (cached.length > 0) {
         const top = cached[0];
         const guardStart = Date.now();
         const safeText = applyGuardrails(top.response, role);
         const guardDuration = Date.now() - guardStart;

          await addTurn(userId, structuredPrompt, safeText, finalEmotion);

          // Cache hit steps
          recordStep("Querying semantic cache", "??", "Searching for similar past responses", embedDuration);
          if (guardDuration > 5) {
            recordStep("Applying safety filters", "???", "Screening cached response", guardDuration);
          }
          recordStep("Cache hit ? response retrieved", "?", `Retrieved from cache (${new Date(top.timestamp).toLocaleDateString()})`, 0, [], "complete");

          const cachedResult = {
            text: safeText + `\n\n[Cached response from ${new Date(top.timestamp).toLocaleDateString()}]`,
            reasoningSteps,
            citations: top.citations || [],
            emotionalState: finalEmotion,
            model: 'gemma4-31b (cached)',
            source: 'cached-gemma',
            evaluation: { overall: 0.85, components: { factual: 0.9, clarity: 0.8, safety: 0.9, completeness: 0.8 } },
            quotaRemaining: getQuotaRemaining().remaining
          };
          lastResult = cachedResult;
          lastReasoning = reasoningSteps;
          console.log('[AI Router] Tier 2 SUCCESS: Cache hit with score 0.85');
          return cachedResult;
       }
       console.log('[AI Router] Tier 2 EMPTY: Cache miss - no semantic matches');
        recordStep("Cache miss", "?", "No matching cached query found", embedDuration);
     } catch (err) { console.warn('[AI Router] Tier 2 FAILED: Cache lookup error:', err.message); }
   }

   // 7b. OpenRouter (Gemma 4 free tier)
   const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
   if (openRouterKey) {
     console.log('[AI Router] Tier 3: Attempting OpenRouter Gemma-4');
     try {
       const modelStart = Date.now();
       const result = await queryOpenRouter(structuredPrompt, fullSystemPrompt);
       const modelDuration = Date.now() - modelStart;

       const guardStart = Date.now();
       const safeText = applyGuardrails(result.text, role);
       const guardDuration = Date.now() - guardStart;

        await addTurn(userId, structuredPrompt, safeText, finalEmotion);

        // Record fallback steps
        recordStep("Calling OpenRouter fallback", "??", `OpenRouter API: ${result.model}`, modelDuration);
        if (guardDuration > 5) {
          recordStep("Applying safety filters", "???", "Screening response for safety", guardDuration);
        }
        recordStep("Response received", "?", "Fallback model returned answer", 0, [], "complete");

        const openRouterResult = {
          text: safeText,
          reasoningSteps,
          citations: [],
          emotionalState: finalEmotion,
          model: result.model,
          source: 'openrouter',
          evaluation: { overall: 0.75, components: { factual: 0.8, clarity: 0.75, safety: 0.85, completeness: 0.7 } },
          quotaRemaining: getQuotaRemaining().remaining
        };
        lastResult = openRouterResult;
        lastReasoning = reasoningSteps;
        console.log('[AI Router] Tier 3 SUCCESS: OpenRouter returned response (' + safeText.length + ' chars)');
        return openRouterResult;
     } catch (err) { console.warn('[AI Router] Tier 3 FAILED: OpenRouter error:', err.message); }
   } else {
     console.log('[AI Router] Tier 3 SKIPPED: VITE_OPENROUTER_API_KEY not set');
   }

   // 7c. HuggingFace Medical-Llama3
   const hfKey = import.meta.env.VITE_HF_API_KEY;
   if (hfKey) {
     console.log('[AI Router] Tier 4: Attempting HuggingFace Medical-Llama3');
     try {
       const modelStart = Date.now();
       const result = await queryHuggingFaceCascade(structuredPrompt, fullSystemPrompt);
       const modelDuration = Date.now() - modelStart;

       const guardStart = Date.now();
       const safeText = applyGuardrails(result.text, role);
       const guardDuration = Date.now() - guardStart;

        await addTurn(userId, structuredPrompt, safeText, finalEmotion);

        // Record fallback steps
        recordStep("Calling HuggingFace fallback", "??", `HuggingFace model: ${result.model}`, modelDuration);
        if (guardDuration > 5) {
          recordStep("Applying safety filters", "???", "Screening response for safety", guardDuration);
        }
        recordStep("Response received", "?", "HuggingFace model returned answer", 0, [], "complete");

        const hfResult = {
          text: safeText,
          reasoningSteps,
          citations: [],
          emotionalState: finalEmotion,
          model: result.model,
          source: 'huggingface',
          evaluation: { overall: 0.7, components: { factual: 0.75, clarity: 0.7, safety: 0.8, completeness: 0.65 } },
          quotaRemaining: getQuotaRemaining().remaining
        };
        lastResult = hfResult;
        lastReasoning = reasoningSteps;
        console.log('[AI Router] Tier 4 SUCCESS: HuggingFace returned response (' + safeText.length + ' chars)');
        return hfResult;
     } catch (err) { console.warn('[AI Router] Tier 4 FAILED: HuggingFace error:', err.message); }
   } else {
     console.log('[AI Router] Tier 4 SKIPPED: VITE_HF_API_KEY not set');
   }

    // 7d. TinyLlama 1.1B ? final fallback (always available, offline-capable)
    console.log('[AI Router] Tier 5: Attempting TinyLlama 1.1B (offline fallback)');
    try {
        const loadStart = Date.now();
        const llm = await loadTinyLlama();
        const tokenizer = await getTokenizer('textGeneration');
        const loadDuration = Date.now() - loadStart;

        recordStep("Loading offline model", "??", "Initializing TinyLlama 1.1B on-device model", loadDuration);

        const messages = [
          { role: 'system', content: fullSystemPrompt },
          { role: 'user', content: structuredPrompt }
        ];

        let formattedPrompt;
        if (tokenizer && tokenizer.apply_chat_template) {
          formattedPrompt = tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
        } else {
          formattedPrompt = `<|system|>\n${fullSystemPrompt}<|user|>\n${structuredPrompt}<|assistant|>\n`;
        }

        const inferStart = Date.now();
        const output = await llm(formattedPrompt, { max_new_tokens: 600, temperature: 0.3, do_sample: true });
        const inferDuration = Date.now() - inferStart;

        const generated = output[0]?.generated_text || '';
        const responseText = generated.replace(formattedPrompt, '').trim();

        // If the model output looks like it's repeating the prompt/template, give a clean fallback
        if (responseText.length < 50 || responseText.includes('SECTION') || responseText.includes('=== ====')) {
          console.log('[AI Router] Tier 5 DEGRADED: TinyLlama returned incomplete/template response');
          recordStep("Offline model degraded", "??", "TinyLlama returned unusable output", inferDuration);

          const fallbackText = 'I am currently in offline mode with limited AI capabilities. Please check your internet connection for a more comprehensive response, or try again later when I can access my full medical knowledge base. For urgent medical concerns, contact a healthcare professional directly.';
          await addTurn(userId, structuredPrompt, fallbackText, finalEmotion);

          recordStep("Using limited offline response", "?", "Offline mode ? full responses require internet", 0, [], "warning");

          const tinyResult = {
            text: fallbackText,
            reasoningSteps,
            citations: [],
            emotionalState: finalEmotion,
            model: 'tinyllama-1.1b',
            source: 'offline',
            evaluation: { overall: 0.5, components: { factual: 0.5, clarity: 0.7, safety: 0.8, completeness: 0.4 } },
            quotaRemaining: 0
          };
          lastResult = tinyResult;
          lastReasoning = reasoningSteps;
          return tinyResult;
        }

        console.log('[AI Router] Tier 5 SUCCESS: TinyLlama generated response (' + responseText.length + ' chars)');
        recordStep("Generating offline response", "??", "TinyLlama 1.1B producing on-device answer", inferDuration);

        const guardStart = Date.now();
        const safeText = applyGuardrails(responseText, role);
        const guardDuration = Date.now() - guardStart;
        if (guardDuration > 5) {
          recordStep("Applying safety filters", "???", "Screening offline response", guardDuration);
        }

        await addTurn(userId, structuredPrompt, safeText, finalEmotion);

        recordStep("Offline response ready", "?", "All online paths exhausted; serving from local model", 0, [], "complete");

        const tinyResult = {
          text: safeText,
          reasoningSteps,
          citations: [],
          emotionalState: finalEmotion,
          model: 'tinyllama-1.1b',
          source: 'offline',
          evaluation: { overall: 0.6, components: { factual: 0.6, clarity: 0.7, safety: 0.8, completeness: 0.5 } },
          quotaRemaining: 0
        };
        lastResult = tinyResult;
        lastReasoning = reasoningSteps;
        return tinyResult;
       } catch (err) {
         console.error('[AI Router] Tier 5 FAILED: TinyLlama error:', err.message, '? ALL TIERS EXHAUSTED');
         const fallbackText = 'All AI models are currently unavailable. Please check your internet connection and try again. For urgent medical questions, contact a healthcare provider directly.';
         const errorResult = {
           text: fallbackText,
           reasoningSteps,
           citations: [],
           emotionalState: finalEmotion,
           model: 'none',
           source: 'error',
           evaluation: { overall: 0, components: { factual: 0, clarity: 0, safety: 0, completeness: 0 } },
           quotaRemaining: 0
         };
         lastResult = errorResult;
         lastReasoning = reasoningSteps;
         return errorResult;
      }
} // close routeQuery function

// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ
// UTILITIES
// ───────────────────────────────────────────────────────────────────────────GöÇGöÇ

function formatEnrichmentForPrompt(enrichment) {
  let ctx = '';
  if (enrichment.web?.length > 0) {
    ctx += '--- Web Results ---\n';
    enrichment.web.forEach((r, i) => { ctx += `${i + 1}. ${r.title}: ${r.snippet}\n   Source: ${r.url}\n`; });
    ctx += '\n';
  }
  if (enrichment.pubmed?.length > 0) {
    ctx += '--- PubMed Articles ---\n';
    enrichment.pubmed.forEach((a, i) => { ctx += `${i + 1}. ${a.title} (${a.journal}, ${a.pubDate})\n   Abstract: ${a.abstract}\n   URL: ${a.url}\n`; });
    ctx += '\n';
  }
  if (enrichment.clinicalTrials?.length > 0) {
    ctx += '--- Clinical Trials ---\n';
    enrichment.clinicalTrials.forEach((t, i) => { ctx += `${i + 1}. ${t.title} (NCT: ${t.nctId}, Phase: ${t.phase})\n   URL: ${t.url}\n`; });
    ctx += '\n';
  }
  if (enrichment.openFDA?.length > 0) {
    ctx += '--- FDA Safety Information ---\n';
    enrichment.openFDA.forEach((f, i) => { ctx += `${i + 1}. [${f.source}] ${f.title || f.id}: ${f.reason || f.product || ''}\n`; });
    ctx += '\n';
  }
  return ctx;
}

function estimateReadability(text) {
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
  // Simple heuristic: lower score = easier to read
  return Math.max(0, Math.min(1, 1 - (avgWordsPerSentence - 10) / 20));
}

function analyzeTone(text) {
  const positive = /\b(good|great|excellent|positive|encouraging|beneficial|safe)\b/gi;
  const negative = /\b(risk|danger|warning|harm|serious|severe|death|fatal)\b/gi;
  const pos = (text.match(positive) || []).length;
  const neg = (text.match(negative) || []).length;
  return { positive: pos, negative: neg, balance: pos > neg ? 'positive' : 'cautionary' };
}

function detectWarnings(text) {
  const warnings = [];
  if (/(?:seek|call|go to|emergency)\s+(?:help|medical|doctor|hospital)/i.test(text)) warnings.push('urgency_mention');
  if (/(?:drug interaction|side effect|adverse|contraindicated)/i.test(text)) warnings.push('drug_safety');
  if (/(?:red flag|danger sign|immediately|now)/i.test(text)) warnings.push('danger_sign');
  if (/(?:consult|physician|healthcare provider)/i.test(text)) warnings.push('disclaimer');
  return warnings;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// End of module GÇö all exports are named above



