// src/services/hybridAIRouter.js
// VITACHAIN HYBRID AI ENGINE — SAM ALTMAN WOULD APPLAUSE EDITION
// Multi-source, reasoning-rich, emotionally-intelligent, self-training health AI
// Routes: Online → Gemma 4 + Brave + PubMed + ClinicalTrials + OpenFDA + WHO + disease.sh
// Offline → gemmaCache + TinyLlama 1.1B
// Fallback ladder: Gemma → OpenRouter → HF → Cache → TinyLlama (NEVER CRASH)

import { pipeline, env } from '@huggingface/transformers';
import { getEmbeddingModel, getTextGenerator, getTokenizer } from './modelLoader.js';
import { searchBrave, searchBraveMedical } from './braveSearch';
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

// Configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent';
const DAILY_QUOTA = parseInt(import.meta.env.VITE_DAILY_QUOTA || '1500');
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const VECTOR_DIM = 384;

// State
let quotaUsed = 0;
let quotaResetDate = new Date().toDateString();
let embedder = null;
let embedderLoaded = false;
let embedderError = null;
let generator = null;
let generatorLoaded = false;
let lastResult = null;
let lastReasoning = [];

// Quota
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
export function incrementQuotaCounter() {
  resetQuotaIfNewDay();
  quotaUsed++;
}

// Embedding
async function loadEmbedder() {
  if (embedderLoaded) return embedder;
  try {
    embedder = await getEmbeddingModel();
    embedderLoaded = true;
    console.log('✅ Embedder ready (all-MiniLM-L6-v2)');
    return embedder;
  } catch (err) {
    embedderError = err;
    throw err;
  }
}
export async function embedText(text) {
  await loadEmbedder();
  try {
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error('Embedding failed:', err);
    throw err;
  }
}

// TinyLlama offline
async function loadTinyLlama() {
  if (generatorLoaded) return generator;
  try {
    generator = await getTextGenerator();
    generatorLoaded = true;
    console.log('✅ TinyLlama 1.1B ready (offline)');
    return generator;
  } catch (err) {
    throw err;
  }
}

// IndexedDB for cache & training
let dbInstance = null;
async function openDB() {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('vitachain', 6);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('gemmaCache')) db.createObjectStore('gemmaCache', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('emotionThreads')) db.createObjectStore('emotionThreads', { keyPath: 'userId' });
      if (!db.objectStoreNames.contains('trainingPairs')) db.createObjectStore('trainingPairs', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror = (e) => reject(e.target.error);
  });
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

async function searchCachedResponses(queryVec, threshold = 0.75) {
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
      .map(item => ({ response: item.response, citations: item.citations, sources: item.sources, reasoning: item.reasoning, timestamp: item.timestamp, similarity: cosineSimilarity(queryVec, item.promptVector) }))
      .filter(r => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    // Remove timestamp later for brevity

    return results;
  } catch (err) {
    console.warn('Cache search failed:', err);
    return [];
  }
}

// Cosine similarity
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

/**
 * Main routing function with full multi-source enrichment
 */
export async function routeQuery(userPrompt, role, personaSystemPrompt, userId = 'guest') {
  resetQuotaIfNewDay();

  // 1. Detect emotion (offline, instant)
  const emotionResult = detectEmotion(userPrompt);

  // 2. Get emotional threading context
  const threadTurns = await getThreadContext(userId);
  const emotionalHistory = buildEmotionalHistoryPrompt(threadTurns);

  // 3. Get emotional trend
  const trend = await getEmotionalTrend(userId);
  const trendSummary = getEmotionalTrendSummary(trend);

  // 4. Build emotional adjustment
  const emotionalAdjustment = buildEmotionalAdjustment(
    emotionResult.state,
    emotionResult.confidence,
    trend,
    trendSummary
  );

  // 5. Build enriched system prompt
  let fullSystemPrompt = personaSystemPrompt;
  if (emotionalAdjustment.instruction) {
    fullSystemPrompt += `\n\n${buildEmotionalContextBlock(emotionResult, trendSummary)}`;
  }
  if (emotionalHistory) {
    fullSystemPrompt += `\n\n${emotionalHistory}`;
  }

  // 6. Check online status
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  const hasQuota = getQuotaRemaining().remaining > 0;

  // 7. ONLINE PATH – Multi-source enrichment
  if (isOnline && hasQuota) {
    try {
      // Enrich with web + medical data sources
      const enrichment = await enrichWithWebData(userPrompt, role);

      // Build final prompt with enrichment
      const enrichedPrompt = buildEnrichedPrompt(userPrompt, enrichment);

      // Call Gemma 4 31B
      const response = await callGemmaAPI(enrichedPrompt, fullSystemPrompt);
      incrementQuotaCounter();

      // Extract reasoning from response if structured
      const reasoning = parseReasoningFromResponse(response.text);
      lastReasoning = reasoning;

      // Extract/assign citations
      const citations = response.citations || enrichment.allCitations || [];

      // Cache for offline use
      try {
        const queryVec = await embedText(userPrompt);
        await storeGemmaResponse(userPrompt, queryVec, response.text, citations, enrichment.allSources, reasoning);
      } catch (cacheErr) { console.warn('Caching skipped:', cacheErr); }

      // Log for self-training
      logInteraction({
        prompt: userPrompt,
        response: response.text,
        role,
        emotionalState: emotionResult.state,
        sources: enrichment.allSources,
        reasoning,
        citations,
        modelUsed: 'gemma4-31b',
        embedding: null // lazy
      });

      // Record emotional turn
      await addTurn(userId, userPrompt, response.text, emotionResult.state);

      lastResult = {
        text: response.text,
        reasoning,
        citations,
        emotionalState: emotionResult.state,
        model: 'gemma4-31b',
        source: 'online',
        quotaRemaining: getQuotaRemaining().remaining,
        reasoningSteps: buildReasoningSteps(lastResult, enrichment)
      };

      return lastResult;
    } catch (err) {
      console.warn('Gemma API failed, falling back:', err.message);
    }
  }

  // 8. ONLINE FALLBACK LADDER

  // 8a. Try cache first (offline available)
  try {
    const queryVec = await embedText(userPrompt);
    const cached = await searchCachedResponses(queryVec, 0.75);

    if (cached.length > 0) {
      const top = cached[0];

      // Record emotional turn
      await addTurn(userId, userPrompt, top.response, emotionResult.state);

      lastResult = {
        text: top.response + `\n\n[Cached response from ${new Date(top.timestamp).toLocaleDateString()}]`,
        reasoning: top.reasoning || [],
        citations: top.citations || [],
        emotionalState: emotionResult.state,
        model: 'gemma4-31b',
        source: 'cached-gemma',
        reasoningSteps: buildReasoningSteps(lastResult)
      };

      return lastResult;
    }
  } catch (err) {
    console.warn('Cache lookup failed:', err);
  }

  // Try OpenRouter (Gemma 4 free)
  try {
    const adjustedPrompt = fullSystemPrompt + `\n\nUser: ${userPrompt}\n\nRemember: provide citations where possible.`;
    const result = await queryOpenRouter(userPrompt, fullSystemPrompt);

    lastResult = {
      text: result.text,
      reasoning: [{ type: 'clinical', title: 'OpenRouter AI', description: 'Response generated via OpenRouter using free Gemma 4 model' }],
      citations: [],
      emotionalState: emotionResult.state,
      model: result.model,
      source: 'openrouter',
      reasoningSteps: buildReasoningSteps(lastResult)
    };

    await addTurn(userId, userPrompt, result.text, emotionResult.state);
    return lastResult;
  } catch (err) {
    console.warn('OpenRouter failed, trying HuggingFace...', err.message);
  }

  // 8b. Try HuggingFace Serverless (Medical-Llama3)
  try {
    const result = await queryHuggingFaceCascade(userPrompt, fullSystemPrompt);

    lastResult = {
      text: result.text,
      reasoning: [{ type: 'clinical', title: 'HuggingFace Medical Model', description: 'Response from Medical-Llama3 via HuggingFace inference' }],
      citations: [],
      emotionalState: emotionResult.state,
      model: result.model,
      source: 'huggingface',
      reasoningSteps: buildReasoningSteps(lastResult)
    };

    await addTurn(userId, userPrompt, result.text, emotionResult.state);
    return lastResult;
  } catch (err) {
    console.warn('HuggingFace failed, falling back to TinyLlama offline...', err.message);
  }

  // 8c. FINAL FALLBACK: TinyLlama 1.1B (always works offline)
  try {
    const llm = await loadTinyLlama();
    const tokenizer = await getTokenizer('textGeneration');

    const messages = [
      { role: 'system', content: fullSystemPrompt },
      { role: 'user', content: userPrompt }
    ];

    let formattedPrompt;
    if (tokenizer && tokenizer.apply_chat_template) {
      formattedPrompt = tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true });
    } else {
      formattedPrompt = `<|system|>\n${fullSystemPrompt}<|user|>\n${userPrompt}<|assistant|>\n`;
    }

    const output = await llm(formattedPrompt, {
      max_new_tokens: 600,
      temperature: 0.3,
      do_sample: true
    });

    const generated = output[0]?.generated_text || '';
    const response = generated.replace(formattedPrompt, '').trim();

    await addTurn(userId, userPrompt, response, emotionResult.state);

    lastResult = {
      text: response || 'I apologize — I am currently offline and unable to generate a response. Please check your internet connection.',
      reasoning: [{ type: 'conclusion', title: 'Offline Response', description: 'Generated by TinyLlama 1.1B on-device model' }],
      citations: [],
      emotionalState: emotionResult.state,
      model: 'tinyllama-1.1b',
      source: 'offline',
      reasoningSteps: buildReasoningSteps(lastResult)
    };

    return lastResult;
  } catch (err) {
    console.error('TinyLlama failed:', err);
    return {
      text: 'I apologize — all AI models (online and offline) are currently unavailable. Please check your internet connection or try again later.',
      reasoning: [],
      citations: [],
      emotionalState: emotionResult.state,
      model: 'none',
      source: 'error'
    };
  }
}

// -------------------------------------------------------------------
// Helper: enrich query with multi-source data
// -------------------------------------------------------------------
async function enrichWithWebData(query, role) {
  const data = {
    brave: [],
    pubmed: [],
    clinicalTrials: [],
    openFDA: [],
    who: null,
    diseaseSh: null
  };

  // Always: Brave Search (medical filter)
  try {
    data.brave = await searchBrave(query, 5);
  } catch (err) { console.warn('Brave failed:', err); }

  // Always: PubMed for evidence
  try {
    data.pubmed = await searchPubMed(query, 3);
  } catch (err) { console.warn('PubMed failed:', err); }

  // If drug mentioned: clinical trials + openFDA
  const drugNames = extractDrugNames(query);
  if (drugNames.length > 0 || query.toLowerCase().includes('drug') || query.toLowerCase().includes('medication')) {
    try {
      data.clinicalTrials = await searchClinicalTrials(drugNames[0] || query, {}, 2);
    } catch (err) { console.warn('ClinicalTrials failed:', err); }
    try {
      data.openFDA = await searchDrugRecalls(drugNames[0]);
      if (data.openFDA.length === 0) {
        const labeling = await searchDrugLabeling(drugNames[0]);
        if (labeling) data.openFDA.push({ source: 'FDA Label', ...labeling });
      }
    } catch (err) { console.warn('OpenFDA failed:', err); }
  }

  // If epidemiology/statistics query: WHO + disease.sh
  if (query.toLowerCase().includes('country') || query.toLowerCase().includes('prevalence') || query.toLowerCase().includes('statistic')) {
    try {
      const usr = detectCountryFromQuery(query);
      if (usr) {
        data.who = await fetchWHOIndicator('RD_POP_RATE', usr);
      }
    } catch (err) { console.warn('WHO failed:', err); }
    try {
      const cc = detectCountryFromQuery(query, 2);
      if (cc) data.diseaseSh = await fetchCovidCountry(cc);
    } catch (err) { console.warn('disease.sh failed:', err); }
  }

  // Flatten citations from all sources
  const allCitations = [];
  data.brave.forEach(r => allCitations.push({ type: 'web', title: r.title, url: r.url, snippet: r.snippet, source: 'Brave Search' }));
  data.pubmed.forEach(a => allCitations.push({ type: 'pubmed', title: a.title, url: a.url, snippet: a.abstract, source: 'PubMed' }));
  data.clinicalTrials.forEach(t => allCitations.push({ type: 'trial', title: t.title, url: t.url, source: 'ClinicalTrials.gov' }));
  data.openFDA.forEach(e => allCitations.push({ type: 'fda', title: e.product || e.id, snippet: e.reason, source: 'FDA' }));
  if (data.who) data.who.forEach(w => allCitations.push({ type: 'who', title: w.indicator, url: w.url, source: 'WHO' }));
  if (data.diseaseSh) allCitations.push({ type: 'outbreak', title: 'COVID-19 Stats', url: 'https://disease.sh/', source: 'disease.sh' });

  data.allCitations = allCitations;
  data.allSources = Object.values(data).flat().filter(Boolean);

  return data;
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
      // Map full name to ISO (simplified)
      const map = { 'nigeria': 'NGA', 'kenya': 'KEN', 'ghana': 'GHA', 'ethiopia': 'ETH', 'south africa': 'ZAF', 'india': 'IND', 'usa': 'USA', 'uk': 'GBR', 'france': 'FRA', 'germany': 'DEU' };
      if (map[w]) return map[w];
    }
  }
  return null;
}

function buildEnrichedPrompt(query, enrichment) {
  let context = 'CURRENT MEDICAL INFORMATION:\n\n';

  if (enrichment.brave.length > 0) {
    context += '--- Web Results ---\n';
    enrichment.brave.forEach((r, i) => {
      context += `${i + 1}. ${r.title}: ${r.snippet}\n   Source: ${r.url}\n`;
    });
    context += '\n';
  }

  if (enrichment.pubmed.length > 0) {
    context += '--- PubMed Articles ---\n';
    enrichment.pubmed.forEach((a, i) => {
      context += `${i + 1}. ${a.title} (${a.journal}, ${a.pubDate})\n   Abstract: ${a.abstract}\n   URL: ${a.url}\n`;
    });
    context += '\n';
  }

  if (enrichment.clinicalTrials.length > 0) {
    context += '--- Clinical Trials ---\n';
    enrichment.clinicalTrials.forEach((t, i) => {
      context += `${i + 1}. ${t.title} (NCT: ${t.nctId}, Phase: ${t.phase})\n   URL: ${t.url}\n`;
    });
    context += '\n';
  }

  if (enrichment.openFDA?.length > 0) {
    context += '--- FDA Safety Information ---\n';
    enrichment.openFDA.forEach((f, i) => {
      context += `${i + 1}. [${f.source}] ${f.title || f.id}: ${f.reason || f.product || ''}\n`;
    });
    context += '\n';
  }

  return `${context}\n\nUSER QUESTION:\n${query}\n\nBased on the information above and your medical knowledge, provide a comprehensive answer. Cite your sources using [1], [2], etc. matching the order above. Be evidence-based and clear.`;
}

// -------------------------------------------------------------------
// Helper: Build emotional context block for system prompt
// -------------------------------------------------------------------
function buildEmotionalContextBlock(emotionResult, trendSummary) {
  const emoji = { crisis: '🔴', distressed: '🟠', sad: '😢', anxious: '😰', frustrated: '😤', neutral: '⚪', curious: '🤔', grateful: '💙', happy: '😊' }[emotionResult.state] || '⚪';

  let block = `EMOTIONAL SUPPORT CONTEXT:\n`;
  block += `Detected user emotional state: ${emoji} ${emotionResult.state} (confidence: ${Math.round(emotionResult.confidence * 100)}%)\n`;
  if (trendSummary) block += `Trend: ${trendSummary}\n`;
  block += `Action: Be ${emoji} ${getToneForState(emotionResult.state)}.\n`;
  block += `CRITICAL: If the user is in CRISIS (${emoji}), immediately provide crisis resources (988 US / 116 123 UK / 91 9820466726 India) and a compassionate message. DO NOT DELAY.`;

  return block;
}

function getToneForState(state) {
  const tones = {
    crisis: 'supportive and directive (GET HELP NOW)',
    distressed: 'gentle, validating, calm',
    anxious: 'grounding, steady, reassuring',
    sad: 'compassionate, patient, hopeful',
    frustrated: 'empathetic, solution-focused',
    neutral: 'balanced and informative',
    curious: 'engaging and thorough',
    grateful: 'warm and encouraging',
    happy: 'positive and celebratory'
  };
  return tones[state] || 'supportive';
}

// -------------------------------------------------------------------
// Helper: Parse reasoning from response (if structured)
// -------------------------------------------------------------------
function parseReasoningFromResponse(text) {
  // Simple heuristic: if response contains numbered steps or sections
  const lines = text.split('\n').filter(l => /(step|phase|stage|1\.|2\.|3\.)/i.test(l));
  if (lines.length > 1) {
    return lines.map(l => ({ type: 'clinical', title: l.trim(), description: '' }));
  }
  return [];
}

// -------------------------------------------------------------------
// Call Gemma 4 31B via Gemini API
// -------------------------------------------------------------------
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

  return { text };
}

// -------------------------------------------------------------------
// Helper: Build reasoning steps array for UI
// -------------------------------------------------------------------
function buildReasoningSteps(queryResult, enrichment = null) {
  const steps = [];

  // Step 1: Enrichment phase
  if (enrichment) {
    const braveHas = enrichment.brave && enrichment.brave.length > 0;
    const pubmedHas = enrichment.pubmed && enrichment.pubmed.length > 0;
    if (braveHas || pubmedHas) {
      steps.push({
        type: 'search',
        title: 'Literature & Web Search',
        description: `Brave: ${enrichment.brave?.length || 0} results, PubMed: ${enrichment.pubmed?.length || 0} articles`,
        sources: (enrichment.brave || []).slice(0, 2).map(r => r.title)
      });
    }
    if (enrichment.clinicalTrials && enrichment.clinicalTrials.length > 0) {
      steps.push({
        type: 'reference',
        title: 'Clinical Trials Check',
        description: `Found ${enrichment.clinicalTrials.length} relevant trials`,
        sources: enrichment.clinicalTrials.map(t => t.nctId)
      });
    }
    if (enrichment.openFDA && enrichment.openFDA.length > 0) {
      steps.push({
        type: 'analysis',
        title: 'Drug Safety Check',
        description: `FDA has ${enrichment.openFDA.length} safety record(s) on file`,
        sources: ['OpenFDA']
      });
    }
    if (enrichment.who || enrichment.diseaseSh) {
      steps.push({
        type: 'reference',
        title: 'Epidemiological Data',
        description: 'Retrieved latest WHO health statistics and/or outbreak data',
        sources: enrichment.who ? ['WHO GHO'] : ['disease.sh']
      });
    }
  }

  // Step 2: Model inference
  const modelUsed = queryResult.model || 'unknown';
  steps.push({
    type: 'clinical',
    title: modelUsed.includes('gemma') ? 'Gemma 4 31B Inference' : modelUsed.includes('tinyllama') ? 'TinyLlama 1.1B (Offline)' : 'AI Model Reasoning',
    description: queryResult.source === 'online' ? 'Online AI generated evidence-based response' : queryResult.source === 'cached-gemma' ? 'Retrieved from cached Gemma response' : 'Generated on-device without internet',
    sources: []
  });

  // Step 3: Synthesis
  steps.push({
    type: 'conclusion',
    title: 'Response Synthesis',
    description: `${queryResult.citations?.length || 0} citation(s) attached. ${queryResult.emotionalState ? `Emotional state: ${queryResult.emotionalState}` : ''}`,
    sources: []
  });

  return steps;
}

// Export utilities
export function getLastRouteResult() { return lastResult; }
export function getLastReasoning() { return lastReasoning; }
export function getEmbedderStatus() {
  if (embedderLoaded) return { loaded: true, loading: false, error: null };
  if (!embedder && !embedderError) return { loaded: false, loading: true, error: null };
  return { loaded: false, loading: false, error: embedderError };
}
