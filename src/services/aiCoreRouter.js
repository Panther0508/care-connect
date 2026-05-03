// src/services/aiCoreRouter.js
// VITACHAIN AI CORE ROUTER — SINGLE ENTRY POINT FOR ALL AI CALLS
// Refactored from hybridAIRouter.js — now THE ONLY canonical AI gateway
// Responsibilities: routing, fallback ladder, caching, safety, evaluation, logging

import { pipeline, env } from '@huggingface/transformers';
import { getEmbeddingModel, getTextGenerator, getTokenizer } from './modelLoader.js';
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

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent';
const DAILY_QUOTA = parseInt(import.meta.env.VITE_DAILY_QUOTA || '1500');
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const VECTOR_DIM = 384;

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
let quotaUsed = 0;
let quotaResetDate = new Date().toDateString();
let embedder = null;
let embedderLoaded = false;
let embedderError = null;
let generator = null;
let generatorLoaded = false;
let generatorLoading = false;
let lastResult = null;
let lastReasoning = [];

// Export getters for backward compatibility
export function getLastRouteResult() { return lastResult; }
export function getLastReasoning() { return lastReasoning; }

// ─────────────────────────────────────────────────────────────────────────────
// QUOTA MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// EMBEDDING (for semantic cache) - with offline fallback
// ─────────────────────────────────────────────────────────────────────────────
export async function loadEmbedder() {
  if (embedderLoaded) return embedder;
  try {
    embedder = await getEmbeddingModel();
    embedderLoaded = true;
    console.log('✅ Embedder ready (all-MiniLM-L6-v2)');
    return embedder;
  } catch (err) {
    embedderError = err;
    console.warn('⚠️ HuggingFace embedder failed, using keyword fallback:', err?.message || err);
    // Return null - embedText will use keyword fallback
    return null;
  }
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

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE MODEL (TinyLlama 1.1B)
// ─────────────────────────────────────────────────────────────────────────────
export async function loadTinyLlama() {
  if (generatorLoaded) return generator;
  if (generatorLoading) {
    // Wait for in-flight load
    while (generatorLoading) { await new Promise(r => setTimeout(r, 50)); }
    if (generatorLoaded) return generator;
    if (generatorError) throw generatorError;
  }

  generatorLoading = true;
  try {
    generator = await getTextGenerator();
    generatorLoaded = true;
    generatorLoading = false;
    console.log('✅ TinyLlama 1.1B ready (offline)');
    return generator;
  } catch (err) {
    generatorLoading = false;
    generatorError = err;
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INDEXEDDB — cache + training + evaluation logs
// ─────────────────────────────────────────────────────────────────────────────
let dbInstance = null;
async function openDB() {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('vitachain', 7); // bump version
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('gemmaCache')) db.createObjectStore('gemmaCache', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('emotionThreads')) db.createObjectStore('emotionThreads', { keyPath: 'userId' });
      if (!db.objectStoreNames.contains('trainingPairs')) db.createObjectStore('trainingPairs', { keyPath: 'id', autoIncrement: true });
      // NEW STORES for evaluation
      if (!db.objectStoreNames.contains('evaluationLogs')) db.createObjectStore('evaluationLogs', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('queryLogs')) db.createObjectStore('queryLogs', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror = (e) => reject(e.target.error);
  });
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

// ─────────────────────────────────────────────────────────────────────────────
// ENRICHMENT ENGINE (multi-source medical data)
// ─────────────────────────────────────────────────────────────────────────────
async function enrichWithWebData(query) {
  const data = { web: [], pubmed: [], clinicalTrials: [], openFDA: [], who: null, diseaseSh: null, searchSource: 'unknown' };

  try {
    // Tiered search: LangSearch → SearXNG → DuckDuckGo
    const webResults = await searchWeb(query, 5);
    data.web = webResults;
    data.searchSource = webResults[0]?.source || 'unknown';
  } catch (e) {
    console.warn('Web search failed:', e);
  }

  try { data.pubmed = await searchPubMed(query, 3); } catch (e) { console.warn('PubMed failed:', e); }

  const drugNames = extractDrugNames(query);
  if (drugNames.length > 0 || query.toLowerCase().includes('drug') || query.toLowerCase().includes('medication')) {
    try { data.clinicalTrials = await searchClinicalTrials(drugNames[0] || query, {}, 2); } catch (e) { console.warn('ClinicalTrials failed:', e); }
    try {
      data.openFDA = await searchDrugRecalls(drugNames[0] || '');
      if (data.openFDA.length === 0) {
        const labeling = await searchDrugLabeling(drugNames[0] || '');
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
  const medKeywords = ['on ', 'taking ', 'drug ', 'medication ', 'prescribed '];
  for (const kw of medKeywords) {
    const idx = query.toLowerCase().indexOf(kw);
    if (idx !== -1) {
      const after = query.substring(idx + kw.length);
      const candidates = after.split(/[,.!?;]/)[0].trim().split(/\s+/);
      if (candidates[0]) return [candidates[0]];
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

// ─────────────────────────────────────────────────────────────────────────────
// GEMMA 4 API CALL (primary online)
// ─────────────────────────────────────────────────────────────────────────────
async function callGemmaAPI(prompt, systemPrompt) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('VITE_GEMINI_API_KEY not set');

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048, topP: 0.9 },
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
    ]
  };

  const resp = await fetch(`${GEMINI_API_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) throw new Error(`Gemini API ${resp.status}`);

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text, model: 'gemma4-31b', source: 'gemini-api' };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ROUTER — THE ONLY ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Route a structured prompt through the AI system
 * @param {object} options
 * @param {string} options.structuredPrompt — Full 4-section prompt (from promptLibrary)
 * @param {string} options.role — 'patient' | 'clinician' | 'chw'
 * @param {string} options.userId — for emotional threading
 * @param {object} options.emotionalContext — { emotionResult, threadTurns, trendSummary }
 * @param {object} options.enrichment — pre-fetched enrichment data (optional, fetched if not provided)
 * @param {boolean} options.useCache — allow cache lookup (default: true)
 * @returns {Promise<object>} { text, reasoning, citations, emotionalState, model, source, evaluation }
 */
export async function routeQuery({
  structuredPrompt,
  role,
  userId = 'guest',
  emotionalContext = {},
  enrichment = null,
  useCache = true
}) {
  const { emotionResult = { state: 'neutral', confidence: 0.8 }, threadTurns = [], trendSummary = null } = emotionalContext;

  // 1. Detect emotion (always)
  const detectedEmotion = detectEmotion(structuredPrompt);
  const finalEmotion = detectedEmotion.state;

  // 2. Get emotional threading
  const historyTurns = threadTurns.length > 0 ? threadTurns : await getThreadContext(userId);
  const emotionalHistory = historyTurns.length > 0 ? buildEmotionalHistoryPrompt(historyTurns) : null;

  // 3. Get trend
  const trend = await getEmotionalTrend(userId);
  const finalTrendSummary = trendSummary || getEmotionalTrendSummary(trend);

  // 4. Assemble full system prompt with emotional context
  let fullSystemPrompt = structuredPrompt;
  if (emotionalHistory) {
    fullSystemPrompt += `\n\n─── CONVERSATION HISTORY ───\n${emotionalHistory}`;
  }

  // 5. Check online status & quota
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  const hasQuota = getQuotaRemaining().remaining > 0;

  // 6. ONLINE PRIMARY PATH (Gemma 4)
  if (isOnline && hasQuota) {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        // Fetch enrichment if not provided
        const enrichmentData = enrichment || (isOnline ? await enrichWithWebData(structuredPrompt) : null);

        // Build final enriched prompt
        const enrichedPrompt = enrichmentData
          ? `${structuredPrompt}\n\n─── MEDICAL LITERATURE ───\n${formatEnrichmentForPrompt(enrichmentData)}`
          : structuredPrompt;

        // Call Gemma 4
        const response = await callGemmaAPI(enrichedPrompt, fullSystemPrompt);
        incrementQuota();

        // Extract citations
        const citations = response.citations || enrichmentData?.allCitations || [];

        // Cache embedding + response
        try {
          const queryVec = await embedText(structuredPrompt);
          await storeGemmaResponse(structuredPrompt, queryVec, response.text, citations, enrichmentData?.allSources || [], []);
        } catch (cacheErr) { /* silent */ }

        // Safety guardrails
        const safeText = applyGuardrails(response.text, role);

        // Evaluation
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
          sources: enrichmentData?.allSources || [],
          reasoning: [],
          citations,
          modelUsed: response.model,
          embedding: null
        });

         // Emotional turn
         await addTurn(userId, structuredPrompt, safeText, finalEmotion);

          const result = {
            text: safeText,
            reasoning: [
              { type: 'search', title: 'Web & Literature Search', description: `Web: ${enrichmentData.searchSource} (${enrichmentData.web?.length || 0} results), PubMed: ${enrichmentData.pubmed?.length || 0} articles` },
              { type: 'clinical', title: 'Gemma 4 via Gemini API', description: 'Primary online model with multi-source enrichment' }
            ],
            citations,
            emotionalState: finalEmotion,
            model: response.model,
            source: 'online',
            evaluation,
            quotaRemaining: getQuotaRemaining().remaining
          };
         lastResult = result;
         lastReasoning = result.reasoning;
         return result;
      } catch (err) {
        console.warn('Gemma failed, falling back:', err.message);
        // Fall through to fallback ladder
      }
    } else {
      console.warn('VITE_GEMINI_API_KEY not set — skipping primary path');
    }
  }

  // 7. FALLBACK LADDER

  // 7a. Cache (if available)
  if (useCache) {
    try {
      const queryVec = await embedText(structuredPrompt);
      const cached = await searchCachedResponses(queryVec, 0.85);
      if (cached.length > 0) {
        const top = cached[0];
        const safeText = applyGuardrails(top.response, role);

         await addTurn(userId, structuredPrompt, safeText, finalEmotion);

         const cachedResult = {
           text: safeText + `\n\n[Cached response from ${new Date(top.timestamp).toLocaleDateString()}]`,
           reasoning: [{ type: 'clinical', title: 'Cached Gemma Response', description: 'Retrieved from local semantic cache' }],
           citations: top.citations || [],
           emotionalState: finalEmotion,
           model: 'gemma4-31b',
           source: 'cached-gemma',
           evaluation: { overall: 0.85, components: { factual: 0.9, clarity: 0.8, safety: 0.9, completeness: 0.8 } },
           quotaRemaining: getQuotaRemaining().remaining
         };
         lastResult = cachedResult;
         lastReasoning = cachedResult.reasoning;
         return cachedResult;
      }
    } catch (err) { console.warn('Cache lookup failed:', err); }
  }

  // 7b. OpenRouter (Gemma 4 free tier)
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (openRouterKey) {
    try {
      const result = await queryOpenRouter(structuredPrompt, fullSystemPrompt);
      const safeText = applyGuardrails(result.text, role);

       await addTurn(userId, structuredPrompt, safeText, finalEmotion);

       const openRouterResult = {
         text: safeText,
         reasoning: [{ type: 'clinical', title: 'OpenRouter Gemma-4', description: 'Fallback via OpenRouter free inference' }],
         citations: [],
         emotionalState: finalEmotion,
         model: result.model,
         source: 'openrouter',
         evaluation: { overall: 0.75, components: { factual: 0.8, clarity: 0.75, safety: 0.85, completeness: 0.7 } },
         quotaRemaining: getQuotaRemaining().remaining
       };
       lastResult = openRouterResult;
       lastReasoning = openRouterResult.reasoning;
       return openRouterResult;
    } catch (err) { console.warn('OpenRouter failed:', err.message); }
  }

  // 7c. HuggingFace Medical-Llama3
  const hfKey = import.meta.env.VITE_HF_API_KEY;
  if (hfKey) {
    try {
      const result = await queryHuggingFaceCascade(structuredPrompt, fullSystemPrompt);
      const safeText = applyGuardrails(result.text, role);

       await addTurn(userId, structuredPrompt, safeText, finalEmotion);

       const hfResult = {
         text: safeText,
         reasoning: [{ type: 'clinical', title: 'Medical-Llama3 via HF', description: 'HuggingFace inference fallback' }],
         citations: [],
         emotionalState: finalEmotion,
         model: result.model,
         source: 'huggingface',
         evaluation: { overall: 0.7, components: { factual: 0.75, clarity: 0.7, safety: 0.8, completeness: 0.65 } },
         quotaRemaining: getQuotaRemaining().remaining
       };
       lastResult = hfResult;
       lastReasoning = hfResult.reasoning;
       return hfResult;
    } catch (err) { console.warn('HuggingFace failed:', err.message); }
  }

   // 7d. TinyLlama 1.1B — final fallback (always available)
   try {
     const llm = await loadTinyLlama();
     const tokenizer = await getTokenizer('textGeneration');

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

     const output = await llm(formattedPrompt, { max_new_tokens: 600, temperature: 0.3, do_sample: true });
     const generated = output[0]?.generated_text || '';
     const responseText = generated.replace(formattedPrompt, '').trim();

     // If the model output looks like it's repeating the prompt/template, give a clean fallback
     if (responseText.length < 50 || responseText.includes('SECTION') || responseText.includes('=== ====')) {
       const fallbackText = 'I am currently in offline mode with limited AI capabilities. Please check your internet connection for a more comprehensive response, or try again later when I can access my full medical knowledge base. For urgent medical concerns, contact a healthcare professional directly.';
        await addTurn(userId, structuredPrompt, fallbackText, finalEmotion);
       const tinyResult = {
         text: fallbackText,
         reasoning: [{ type: 'conclusion', title: 'Offline Limited', description: 'TinyLlama offline model available but connectivity required for full responses' }],
         citations: [],
         emotionalState: finalEmotion,
         model: 'tinyllama-1.1b',
         source: 'offline',
         evaluation: { overall: 0.5, components: { factual: 0.5, clarity: 0.7, safety: 0.8, completeness: 0.4 } },
         quotaRemaining: 0
       };
       lastResult = tinyResult;
       lastReasoning = tinyResult.reasoning;
       return tinyResult;
     }

      const safeText = applyGuardrails(responseText, role);

      await addTurn(userId, structuredPrompt, safeText, finalEmotion);

      const tinyResult = {
        text: safeText,
        reasoning: [{ type: 'conclusion', title: 'TinyLlama Offline', description: 'On-device 1.1B model — always available without internet' }],
        citations: [],
        emotionalState: finalEmotion,
        model: 'tinyllama-1.1b',
        source: 'offline',
        evaluation: { overall: 0.6, components: { factual: 0.6, clarity: 0.7, safety: 0.8, completeness: 0.5 } },
        quotaRemaining: 0
      };
      lastResult = tinyResult;
      lastReasoning = tinyResult.reasoning;
      return tinyResult;
    } catch (err) {
      console.error('TinyLlama failed:', err);
      const fallbackText = 'All AI models are currently unavailable. Please check your internet connection and try again. For urgent medical questions, contact a healthcare provider directly.';
      const errorResult = {
        text: fallbackText,
        reasoning: [],
        citations: [],
        emotionalState: finalEmotion,
        model: 'none',
        source: 'error',
        evaluation: { overall: 0, components: { factual: 0, clarity: 0, safety: 0, completeness: 0 } },
        quotaRemaining: 0
      };
      lastResult = errorResult;
      lastReasoning = [];
      return errorResult;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function formatEnrichmentForPrompt(enrichment) {
  let ctx = '';
  if (enrichment.brave?.length > 0) {
    ctx += '--- Web Results ---\n';
    enrichment.brave.forEach((r, i) => { ctx += `${i + 1}. ${r.title}: ${r.snippet}\n   Source: ${r.url}\n`; });
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

// End of module — all exports are named above

