// src/services/hybridAIEngine.js
// VITACHAIN HYBRID AI ENGINE — Phase 0-7 Implementation
// Parallel-fire Gemma models + Gemma-3B judge + silent sequential fallback
// Hybrid BM25-vector RAG + knowledge distillation

import { openDB } from '../lib/idb';
import { pipeline, env } from '@huggingface/transformers';
import { loadEmbedder, embedText } from './advancedRAG.js';
import { searchWeb } from './webSearchService.js';
import { queryOpenRouter, queryOpenRouterFallback } from './openRouterService.js';
import { queryHuggingFaceCascade } from './huggingfaceService.js';
import { detectEmotion } from './emotionDetector.js';
import { getThreadContext, addTurn, buildEmotionalHistoryPrompt, getEmotionalTrend } from './emotionalThreading.js';
import { applyGuardrails } from './safetyGuardrails.js';
import { evaluateResponse } from './evaluationEngine.js';
import { logInteraction } from './selfTrainingEngine.js';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 0: CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

// Model endpoints configuration
const MODEL_ENDPOINTS = {
  // Gemini models for parallel fire
  gemini_2_0: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent',
  gemini_judge: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
  // Fallback models
  openrouter_gemma: 'google/gemma-2-9b-it:free',
  hf_medical_llama: 'google/medllama3-8b'
};

// ─────────────────────────────────────────────────────────────────────────────
// STATE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

let dbInstance = null;
let embedderReady = false;

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1: PARALLEL FIRE + GEMMA JUDGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fire all available models in parallel for the same query
 * @param {string} prompt - The structured prompt to send all models
 * @param {string} systemPrompt - The system prompt
 * @returns {Promise<{responses: Array, judged: Object}>}
 */
export async function fireAllModelsInParallel(prompt, systemPrompt) {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const hfKey = import.meta.env.VITE_HF_API_KEY;

  const promises = [];
  const modelIds = [];

  // Fire Gemini 2.0 Flash (primary online)
  if (geminiKey) {
    promises.push(callGemmaAPI(prompt, systemPrompt, 'gemini-2.0-flash'));
    modelIds.push('gemini-2.0-flash');
  }

  // Fire OpenRouter Gemma as fallback
  if (openrouterKey) {
    promises.push(queryOpenRouter(prompt, systemPrompt, 'google/gemma-2-9b-it:free'));
    modelIds.push('gemma-2-9b-or');
  }

  // Fire HuggingFace Medical-Llama3 as another parallel path
  if (hfKey) {
    promises.push(queryHuggingFaceCascade(prompt, systemPrompt));
    modelIds.push('medllama3-8b');
  }

  // ALWAYS fire TinyLlama locally (offline-capable)
  promises.push(runTinyLlama(prompt, systemPrompt).catch(e => ({ text: '', source: 'error', model: 'tinyllama-1.1b' })));
  modelIds.push('tinyllama-1.1b');

  // Execute all in parallel
  const results = await Promise.allSettled(promises);

  const responses = results.map((r, i) => ({
    model: modelIds[i],
    success: r.status === 'fulfilled' && r.value?.text?.length > 10,
    text: r.status === 'fulfilled' ? r.value?.text || '' : '',
    source: r.status === 'fulfilled' ? r.value?.source || 'online' : 'error',
    error: r.status === 'rejected' ? r.reason?.message : null
  })).filter(r => r.success);

  // Judge the responses if we have multiple
  let judged = null;
  if (responses.length > 1 && geminiKey) {
    try {
      judged = await judgeResponses(prompt, responses);
    } catch (judgeErr) {
      console.warn('Judging failed:', judgeErr);
    }
  }

  return { responses, judged };
}

/**
 * Judge multiple model responses and select the best one
 * Uses Gemma 3B as a critic model
 */
async function judgeResponses(prompt, responses) {
  if (responses.length === 0) return null;

  try {
    const judgingPrompt = `Evaluate these medical AI responses and pick the best one.
Query: ${prompt.substring(0, 300)}
Responses:
${responses.map((r, i) => `[ID: ${i + 1}] Model ${r.model}:\n${r.text.substring(0, 500)}...\n---`).join('\n\n')}

Select the winner ID (1-${responses.length}) and explain why.
Return JSON ONLY: {"winner": ID, "reasoning": "string"}`;

    const judgeSystemPrompt = "You are a senior medical AI critic. Select the most accurate, safe, and helpful response. Return JSON.";

    const result = await callGemmaAPI(judgingPrompt, judgeSystemPrompt, 'gemini-1.5-flash');
    
    let parsed;
    try {
      const cleanJson = result.text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Judge returned invalid JSON:', result.text);
      parsed = { winner: 1, reasoning: 'Auto-selected first response due to parsing error' };
    }

    const winnerIdx = (parsed.winner || 1) - 1;
    return {
      winner: responses[winnerIdx] || responses[0],
      allResponses: responses,
      reasoning: parsed.reasoning
    };
  } catch (err) {
    console.warn('Judging process failed:', err);
    return { winner: responses[0], allResponses: responses, reasoning: 'Fallback to first available' };
  }
}

/**
 * Call Gemma API (shared helper)
 */
async function callGemmaAPI(prompt, systemPrompt, modelName) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('VITE_GEMINI_API_KEY not set');

  const isJudge = modelName === 'gemini-1.5-flash';
  const endpoint = isJudge ? MODEL_ENDPOINTS.gemini_judge : MODEL_ENDPOINTS.gemini_2_0;

  const body = {
    contents: [{ 
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\n${prompt}` }] 
    }],
    generationConfig: { 
      temperature: isJudge ? 0.1 : 0.3,
      maxOutputTokens: 2048,
      responseMimeType: isJudge ? "application/json" : "text/plain"
    }
  };

  const resp = await fetch(`${endpoint}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) throw new Error(`Gemma API ${resp.status}`);

  const data = await resp.json();
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    model: modelName,
    source: 'online'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2: SILENT SEQUENTIAL FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sequential fallback that never shows errors to user
 * Returns a valid response from somewhere
 */
export async function sequentialFallback(prompt, systemPrompt) {
  // 1. Cache check
  const cached = await searchCachedResponses(prompt);
  if (cached) {
    return {
      text: cached.response,
      reasoning: [{ type: 'cached', title: 'Cached Response', description: 'Retrieved from local cache' }],
      citations: cached.citations || [],
      model: cached.model,
      source: 'cached'
    };
  }

  // 2. OpenRouter
  try {
    const result = await queryOpenRouter(prompt, systemPrompt);
    return formatFallbackResult(result, 'openrouter');
  } catch (e) { /* silent */ }

  // 3. HuggingFace
  try {
    const result = await queryHuggingFaceCascade(prompt, systemPrompt);
    return formatFallbackResult(result, 'huggingface');
  } catch (e) { /* silent */ }

  // 4. TinyLlama (must succeed - offline fallback)
  try {
    const result = await runTinyLlama(prompt, systemPrompt);
    return formatFallbackResult(result, 'offline');
  } catch (e) { /* silent */ }

  // 5. Ultimate fallback - static response
  return {
    text: "I'm currently unable to process your request. Please check your connection and try again. If this persists, contact support.",
    reasoning: [],
    citations: [],
    model: 'none',
    source: 'fallback'
  };
}

function formatFallbackResult(result, source) {
  return {
    text: result.text,
    reasoning: [{ type: 'clinical', title: `Fallback via ${source}`, description: 'Sequential fallback path' }],
    citations: result.citations || [],
    model: result.model || 'unknown',
    source
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3: BM25 SCORER FOR HYBRID RAG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BM25 implementation for keyword search scoring
 * Works alongside vector similarity for hybrid retrieval
 */
export class BM25Scorer {
  constructor() {
    this.docFreqs = new Map();
    this.docCount = 0;
    this.avgDocLen = 0;
  }

  /**
   * Calculate BM25 score for a query against documents
   */
  score(query, documents) {
    const terms = query.toLowerCase().split(/\s+/);
    const scores = [];

    for (const doc of documents) {
      let score = 0;
      const docTerms = (doc.text || '').toLowerCase().split(/\s+/);
      const docLen = docTerms.length;

      for (const term of terms) {
        const tf = docTerms.filter(t => t === term).length;
        if (tf > 0) {
          // Simplified BM25: score based on term frequency and document length
          const idf = Math.log((this.docCount + 1) / (this.docFreqs.get(term) || 1));
          const tfNorm = tf / (tf + 1.5);
          const lenNorm = 1 - docLen / this.avgDocLen;
          score += idf * tfNorm * (1 + lenNorm);
        }
      }

      scores.push({ ...doc, bm25Score: score });
    }

    return scores.sort((a, b) => b.bm25Score - a.bm25Score);
  }

  /**
   * Update document frequencies
   */
  updateIndex(documents) {
    this.docCount = documents.length;
    this.avgDocLen = documents.reduce((sum, d) => sum + ((d.text || '').split(/\s+/).length), 0) / this.docCount;

    // Calculate document frequencies
    for (const doc of documents) {
      const terms = new Set((doc.text || '').toLowerCase().split(/\s+/));
      for (const term of terms) {
        this.docFreqs.set(term, (this.docFreqs.get(term) || 0) + 1);
      }
    }
  }
}

export const bm25 = new BM25Scorer();

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4: KNOWLEDGE DISTILLATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Teach-by-cache: Store high-quality responses for offline distillation
 */
export async function teachByCache(prompt, response, evaluation) {
  if (!evaluation || evaluation.overall < 0.7) return;

  try {
    const db = await openDB();
    const tx = db.transaction('trainingPairs', 'readwrite');
    const store = tx.objectStore('trainingPairs');

    await store.add({
      prompt,
      response: response.text,
      evaluationScore: evaluation.overall,
      timestamp: Date.now(),
      modelUsed: response.model
    });

    await tx.done;
  } catch (err) {
    console.warn('Teach-by-cache failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5: INTEGRATION WITH EXISTING SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main entry point: Generate response with full hybrid pipeline
 */
export async function generateHybridResponse({
  structuredPrompt,
  role = 'patient',
  userId = 'guest',
  emotionalContext = {},
  useCache = true,
  extractedQuery = null,
  enrichment = null
}) {
  const { emotionResult = { state: 'neutral' }, threadTurns = [] } = emotionalContext;

  // Detect emotion
  const detectedEmotion = detectEmotion(structuredPrompt);
  const finalEmotion = detectedEmotion.state;

  // Get emotional context
  const historyTurns = threadTurns.length > 0 ? threadTurns : await getThreadContext(userId);
  const emotionalHistory = historyTurns.length > 0 ? buildEmotionalHistoryPrompt(historyTurns) : null;

  // Build full prompt
  let fullSystemPrompt = structuredPrompt;
  if (emotionalHistory) {
    fullSystemPrompt += `\n\n──— CONVERSATION HISTORY ───\n${emotionalHistory}`;
  }

  // Parallel fire if online, sequential fallback if offline
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  let result;

  if (isOnline) {
    const enrichedPrompt = enrichment 
      ? `${structuredPrompt}\n\n──— MEDICAL LITERATURE ───\n${formatEnrichmentForPrompt(enrichment)}`
      : structuredPrompt;

    const parallelResult = await fireAllModelsInParallel(enrichedPrompt, fullSystemPrompt);
    
    if (parallelResult.judged) {
      result = {
        text: applyGuardrails(parallelResult.judged.winner.text, role),
        reasoning: [
          { type: 'search', title: 'Parallel Gemma Models', description: Evaluated \ model responses },
          { type: 'judge', title: 'Judge evaluation', description: parallelResult.judged.reasoning }
        ],
        citations: [],
        emotionalState: finalEmotion,
        model: parallelResult.judged.winner.model,
        source: 'parallel-fire'
      };
    } else if (parallelResult.responses.length > 0) {
      result = {
        text: applyGuardrails(parallelResult.responses[0].text, role),
        reasoning: [{ type: 'search', title: 'Parallel Gemma Models', description: `${parallelResult.responses.length} models fired in parallel` }],
        citations: [],
        emotionalState: finalEmotion,
        model: parallelResult.responses[0].model,
        source: 'parallel-fire'
      };
    } else {
      result = await sequentialFallback(structuredPrompt, fullSystemPrompt);
    }
  } else {
    result = await sequentialFallback(structuredPrompt, fullSystemPrompt);
  }

  // Apply guardrails and evaluate
  const safeText = applyGuardrails(result.text, role);
  const evaluation = evaluateResponse({
    text: safeText,
    role,
    model: result.model,
    sources: result.citations?.length > 0 ? 'enriched' : 'none',
    hasCitations: result.citations?.length > 0,
    hasUncertainty: /may|might|suggests/i.test(safeText),
    wordCount: safeText.split(/\s+/).length,
    emotionalTone: detectedEmotion.state
  });

  // Log for training
  logInteraction({
    prompt: structuredPrompt,
    response: safeText,
    role,
    emotionalState: finalEmotion,
    sources: result.citations || [],
    reasoning: result.reasoning,
    modelUsed: result.model
  });

  // Store in cache
  await storeGemmaResponse(structuredPrompt, [], safeText, result.citations || [], [], result.reasoning);

  // Add turn to emotional thread
  await addTurn(userId, structuredPrompt, safeText, finalEmotion);

  return {
    text: safeText,
    reasoning: result.reasoning,
    citations: result.citations || [],
    emotionalState: finalEmotion,
    model: result.model,
    source: result.source,
    evaluation
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function formatEnrichmentForPrompt(enrichment) {
  let ctx = '';
  if (enrichment?.web?.length > 0) {
    ctx += 'Web: ' + enrichment.web.slice(0, 3).map((r, i) => `${i+1}. ${r.title}`).join('; ');
  }
  return ctx;
}

async function searchCachedResponses(prompt) {
  try {
    const db = await openDB();
    const tx = db.transaction('gemmaCache', 'readonly');
    const store = tx.objectStore('gemmaCache');
    const request = store.getAll();
    
    const all = await new Promise(r => { request.onsuccess = () => r(request.result || []); });
    
    return all.find(item => item.prompt === prompt);
  } catch { return null; }
}

async function storeGemmaResponse(prompt, vector, response, citations, sources, reasoning) {
  try {
    const db = await openDB();
    const tx = db.transaction('gemmaCache', 'readwrite');
    const store = tx.objectStore('gemmaCache');
    await store.add({
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prompt,
      promptVector: vector,
      response,
      citations,
      sources,
      reasoning,
      model: 'hybrid-engine',
      timestamp: Date.now()
    });
    await tx.done;
  } catch (e) { /* silent */ }
}

async function runTinyLlama(prompt, systemPrompt) {
  // Lazy load TinyLlama from GitHub Releases
  const generator = await loadTinyLlamaFromGitHub();
  const output = await generator(prompt, { max_new_tokens: 500, temperature: 0.3 });
  return { text: output[0]?.generated_text || '', model: 'tinyllama-1.1b' };
}

async function loadTinyLlamaFromGitHub() {
  // Model loader will handle this properly
  const { getTextGenerator } = await import('./modelLoader.js');
  return getTextGenerator();
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export default {
  fireAllModelsInParallel,
  judgeResponses,
  sequentialFallback,
  generateHybridResponse,
  BM25Scorer,
  bm25,
  teachByCache
};