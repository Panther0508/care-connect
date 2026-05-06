// src/services/aiCoreRouter.js
// VITACHAIN AI CORE ROUTER GÇö SINGLE ENTRY POINT FOR ALL AI CALLS
// Refactored from hybridAIRouter.js GÇö now THE ONLY canonical AI gateway
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

// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// CONFIGURATION
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent';
const DAILY_QUOTA = parseInt(import.meta.env.VITE_DAILY_QUOTA || '1500');
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const VECTOR_DIM = 384;

// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// STATE
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
let quotaUsed = 0;
let quotaResetDate = new Date().toDateString();
let embedder = null;
let embedderLoaded = false;
let embedderLoading = false;
let embedderError = null;
let embedderCooldownUntil = 0; // Cooldown timestamp after permanent failure
let generator = null;
let generatorLoaded = false;
let generatorLoading = false;
let generatorError = null;
let lastResult = null;
let lastReasoning = [];

// Export getters for backward compatibility
export function getLastRouteResult() { return lastResult; }
export function getLastReasoning() { return lastReasoning; }

// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// QUOTA MANAGEMENT
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
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

// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// EMBEDDING (for semantic cache) - with offline fallback
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
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
      console.log('G£à Embedder ready (all-MiniLM-L6-v2)');
      return embedder;
    } catch (err) {
      lastErr = err;
      console.warn(`GÜán+Å Embedder attempt ${attempt} failed:`, err?.message || err);
      if (attempt < maxAttempts) {
        const delay = attempt === 1 ? 2000 : attempt === 2 ? 4000 : 6000;
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
  console.error('G¥î Embedder failed after 3 attempts, using keyword fallback');
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

// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// OFFLINE MODEL (TinyLlama 1.1B)
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
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
    console.log('G£à TinyLlama 1.1B ready (offline)');
    return generator;
  } catch (err) {
    generatorLoading = false;
    generatorError = err;
    throw err;
  }
}

// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// INDEXEDDB GÇö cache + training + evaluation logs
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
let dbInstance = null;
async function openDB() {
  if (dbInstance) return dbInstance;
  
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB not available in this environment');
  }
  
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open('vitachain', 10); // unified version v10
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('gemmaCache')) db.createObjectStore('gemmaCache', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('emotionThreads')) db.createObjectStore('emotionThreads', { keyPath: 'userId' });
        if (!db.objectStoreNames.contains('trainingPairs')) db.createObjectStore('trainingPairs', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('evaluationLogs')) db.createObjectStore('evaluationLogs', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('queryLogs')) db.createObjectStore('queryLogs', { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
      req.onerror = (e) => {
        console.error('IDB open error:', e.target.error);
        reject(e.target.error);
      };
    } catch (err) {
      console.error('IDB init failed:', err);
      reject(err);
    }
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

// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// ENRICHMENT ENGINE (multi-source medical data)
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
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

// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// GEMMA 4 API CALL (primary online)
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
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

// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// MAIN ROUTER GÇö THE ONLY ENTRY POINT
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
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
 * @returns {Promise<object>} { text, reasoning, citations, emotionalState, model, source, evaluation }
 */
export async function routeQuery({
  structuredPrompt,
  role,
  userId = 'guest',
  emotionalContext = {},
  enrichment = null,
  useCache = true,
  extractedQuery = null
}) {
  // GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
  // CRITICAL: Log router invocation for debugging
  // GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  const quotaInfo = getQuotaRemaining();
  console.log('[AI Router] routeQuery called. Online:', isOnline, 'Credits:', quotaInfo.used + '/' + DAILY_QUOTA, '(Remaining:', quotaInfo.remaining + ')', 'Role:', role || 'none');

  // Extract user question from structuredPrompt if not provided
  let finalExtractedQuery = extractedQuery;
  if (!finalExtractedQuery) {
    // Try to find the TASK section and extract from there
    const taskMatch = structuredPrompt.match(/GöÇGöÇGöÇ SECTION 2: TASK GöÇGöÇGöÇ\s*([^GöÇ]*?)(?=GöÇGöÇGöÇ SECTION|$)/s);
    if (taskMatch && taskMatch[1]) {
      finalExtractedQuery = taskMatch[1].split('\n')[0].trim();
    }
    // Fallback to first 200 chars if no TASK section found
    if (!finalExtractedQuery) {
      finalExtractedQuery = structuredPrompt.substring(0, 200).split('\n')[0];
    }
  }

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
    fullSystemPrompt += `\n\nGöÇGöÇGöÇ CONVERSATION HISTORY GöÇGöÇGöÇ\n${emotionalHistory}`;
  }

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
           ? `${structuredPrompt}\n\nGöÇGöÇGöÇ MEDICAL LITERATURE GöÇGöÇGöÇ\n${formatEnrichmentForPrompt(enrichment)}`
           : structuredPrompt;

         // Call Gemma 4
         const response = await callGemmaAPI(enrichedPrompt, fullSystemPrompt);
         incrementQuota();

         // Extract citations
         const citations = response.citations || enrichment?.allCitations || [];

         // Cache embedding + response
         try {
           const queryVec = await embedText(structuredPrompt);
           await storeGemmaResponse(structuredPrompt, queryVec, response.text, citations, enrichment?.allSources || [], []);
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
           sources: enrichment?.allSources || [],
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
               { type: 'search', title: 'Web & Literature Search', description: `Web: ${enrichment?.searchSource || 'none'} (${enrichment?.web?.length || 0} results), PubMed: ${enrichment?.pubmed?.length || 0} articles` },
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

  // 7a. Cache (if available)
  if (useCache) {
    console.log('[AI Router] Tier 2: Attempting cached Gemma response');
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
         console.log('[AI Router] Tier 2 SUCCESS: Cache hit with score 0.85');
         return cachedResult;
      }
      console.log('[AI Router] Tier 2 EMPTY: Cache miss - no semantic matches');
    } catch (err) { console.warn('[AI Router] Tier 2 FAILED: Cache lookup error:', err.message); }
  }

  // 7b. OpenRouter (Gemma 4 free tier)
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (openRouterKey) {
    console.log('[AI Router] Tier 3: Attempting OpenRouter Gemma-4');
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
       console.log('[AI Router] Tier 4 SUCCESS: HuggingFace returned response (' + safeText.length + ' chars)');
       return hfResult;
    } catch (err) { console.warn('[AI Router] Tier 4 FAILED: HuggingFace error:', err.message); }
  } else {
    console.log('[AI Router] Tier 4 SKIPPED: VITE_HF_API_KEY not set');
  }

   // 7d. TinyLlama 1.1B ? final fallback (always available, offline-capable)
   console.log('[AI Router] Tier 5: Attempting TinyLlama 1.1B (offline fallback)');
   try {
       const llm = await loadTinyLlama();
       console.log('[AI Router] TinyLlama model loaded successfully');
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
         console.log('[AI Router] Tier 5 DEGRADED: TinyLlama returned incomplete/template response');
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

       console.log('[AI Router] Tier 5 SUCCESS: TinyLlama generated response (' + responseText.length + ' chars)');
       const safeText = applyGuardrails(responseText, role);

       await addTurn(userId, structuredPrompt, safeText, finalEmotion);

       const tinyResult = {
         text: safeText,
         reasoning: [{ type: 'conclusion', title: 'TinyLlama Offline', description: 'On-device 1.1B model GÇö always available without internet' }],
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
        console.error('[AI Router] Tier 5 FAILED: TinyLlama error:', err.message, '? ALL TIERS EXHAUSTED');
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
} // close routeQuery function

// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ
// UTILITIES
// GöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇGöÇ

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


