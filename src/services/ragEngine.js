// src/services/ragEngine.js
// Retrieval-Augmented Generation pipeline using feature-extraction pipeline
// Embeds datasets and queries using all-MiniLM-L6-v2 model

import { pipeline, env } from '@huggingface/transformers';
import { openDB } from '../lib/idb';

// Embedding model: LOCAL ONLY — no remote CDN fetches
env.allowRemoteModels = false;   // Block HuggingFace CDN
env.allowLocalModels = true;     // Allow /models/ path
env.useBrowserCache = true;

let embedder = null;
let embedderLoading = false;
let embedderLoaded = false;
let embedderError = null;
let embedderCooldownUntil = 0; // Cooldown timestamp after permanent failure

const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const VECTOR_DIM = 384; // all-MiniLM-L6-v2 produces 384-dim vectors

// Simple keyword-based embedding fallback (offline-safe)
function keywordEmbed(text) {
  const words = text.toLowerCase().split(/\s+/);
  const features = {};
  words.forEach((w) => {
    const hash = [...w].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    features[Math.abs(hash) % 384] = (features[Math.abs(hash) % 384] || 0) + 1;
  });
  const vec = new Array(384).fill(0);
  Object.entries(features).forEach(([idx, val]) => { vec[parseInt(idx)] = Math.min(val, 5); });
  const mag = Math.sqrt(vec.reduce((a, b) => a + b * b, 0)) || 1;
  return vec.map(v => v / mag);
}

/**
 * Load the embedding model
 */
export async function loadEmbeddingModel() {
  if (embedderLoaded) return embedder;
  if (embedderLoading) {
    // Wait for in-flight load
    while (embedderLoading) { await new Promise(r => setTimeout(r, 50)); }
    if (embedderLoaded) return embedder;
    if (embedderError) return null;
  }

  // Cooldown check after permanent failure
  if (embedderError && embedderCooldownUntil) {
    if (Date.now() < embedderCooldownUntil) {
      console.log('RAG Engine embedder in cooldown until', new Date(embedderCooldownUntil).toISOString());
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
      console.log(`Loading embedding model (attempt ${attempt}/${maxAttempts}): ${EMBEDDING_MODEL}`);
      embedder = await pipeline('feature-extraction', EMBEDDING_MODEL, {
        progress_callback: (progress) => {
          if (progress.status === 'downloading') {
            const pct = Math.round((progress.loaded / progress.total) * 100);
            console.log(`  Embedding model: ${pct}%`);
          }
        }
      });
      embedderLoaded = true;
      embedderLoading = false;
      console.log('✅ Embedding model loaded (all-MiniLM-L6-v2)');
      return embedder;
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️ Embedder attempt ${attempt} failed:`, err?.message || err);
      if (attempt < maxAttempts) {
        const delay = attempt === 1 ? 2000 : attempt === 2 ? 4000 : 6000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  embedderError = lastErr;
  embedder = null;
  embedderLoaded = false;
  embedderLoading = false; // Reset loading flag
  embedderCooldownUntil = Date.now() + 20 * 60 * 1000; // 20 minutes cooldown
  console.error('❌ Embedder failed after 3 attempts, using keyword fallback');
  return null;
}

/**
 * Generate embedding for a text string
 */
export async function embedText(text) {
  if (!embedder) await loadEmbeddingModel();
  if (!embedder) {
    console.warn('Using keyword-based embedding fallback (ragEngine)');
    return keywordEmbed(text);
  }
  try {
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data);
    return vector;
  } catch (err) {
    console.error('Embedding failed, fallback to keyword:', err);
    return keywordEmbed(text);
  }
}

/**
 * Embed all entries in a dataset and store in IndexedDB
 * datasetName: e.g., 'drug-counseling', 'exercises', 'foods'
 * items: array of { id, text, ...metadata }
 */
export async function embedDataset(datasetName, items) {
  if (!embedder) await loadEmbeddingModel();
  const db = await openDB();

  // Create object store if it doesn't exist
  if (!db.objectStoreNames.contains('datasetVectors')) {
    db.createObjectStore('datasetVectors', { keyPath: 'id' });
  }

  const vectors = [];
  const tx = db.transaction('datasetVectors', 'readwrite');
  const store = tx.objectStore('datasetVectors');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const text = item.text || item.name || JSON.stringify(item);
    try {
      const embedding = await embedText(text);
      const vector = {
        id: `${datasetName}-${item.id || i}`,
        dataset: datasetName,
        entryIndex: i,
        itemId: item.id,
        vector: embedding,
        source: item,
        timestamp: Date.now()
      };
      vectors.push(vector);
      store.put(vector);
    } catch (err) {
      console.error(`Failed to embed item ${i} in ${datasetName}:`, err);
    }
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve({ datasetName, embedded: items.length });
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve top-k similar entries from a dataset
 */
export async function retrieveContext(query, datasetName, topK = 5) {
  const queryVec = await embedText(query);
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('datasetVectors', 'readonly');
    const store = tx.objectStore('datasetVectors');
    const request = store.getAll();

    request.onsuccess = () => {
      const all = request.result || [];
      const filtered = datasetName ?
        all.filter(v => v.dataset === datasetName) : all;

      const results = filtered.map(item => ({
        ...item,
        similarity: cosineSimilarity(queryVec, item.vector)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  return magA * magB === 0 ? 0 : dot / (magA * magB);
}

/**
 * Check if a query is dataset-related
 */
export function isDatasetQuery(query) {
  const lower = query.toLowerCase();
  const keywords = {
    'drug-counseling': ['medication', 'drug', 'pill', 'medicine', 'prescription', 'dosage', 'side effect', 'interaction'],
    'foods': ['calorie', 'nutrition', 'protein', 'food', 'eat', 'diet', 'sugar', 'carb'],
    'exercises': ['exercise', 'workout', 'strength', 'muscle', 'stretch', 'fitness', 'rep', 'set'],
    'first-aid': ['emergency', 'first aid', 'injury', 'burn', 'bleed', 'wound', 'poison', 'bite'],
    'immunization': ['vaccine', 'immunization', 'shot', 'vaccination', 'booster'],
    'preventive-care': ['screening', 'checkup', 'prevent', 'test', 'exam'],
    'icd10': ['code', 'icd10', 'diagnosis', 'billing'],
    'rxnorm': ['interaction', 'rxnorm', 'drug interaction']
  };

  let bestMatch = { dataset: null, confidence: 0 };
  for (const [dataset, terms] of Object.entries(keywords)) {
    const matches = terms.filter(t => lower.includes(t)).length;
    if (matches > bestMatch.confidence) {
      bestMatch = { dataset, confidence: matches };
    }
  }

  return bestMatch.confidence >= 1 ? bestMatch : null;
}

/**
 * Build augmented prompt with retrieved context
 */
export function buildAugmentedPrompt(userQuery, retrievedItems, systemPrompt) {
  let context = '';
  if (retrievedItems && retrievedItems.length > 0) {
    context = 'Relevant information from our database:\n';
    retrievedItems.forEach((item, i) => {
      const source = item.source || {};
      if (source.text) context += `${i + 1}. ${source.text}\n`;
      else if (source.name) context += `${i + 1}. ${source.name}: ${JSON.stringify(source)}\n`;
      else context += `${i + 1}. ${JSON.stringify(source)}\n`;
    });
    context += '\n';
  }

  const messages = [
    { role: 'system', content: systemPrompt + '\n\n' + context },
    { role: 'user', content: userQuery }
  ];

  return messages;
}

/**
 * Get embedding model status
 */
export function getEmbedderStatus() {
  if (embedderLoaded) return { loaded: true, loading: false, error: null };
  if (embedderError) return { loaded: false, loading: false, error: embedderError.message };
  return { loaded: false, loading: embedderLoading, error: null };
}

// Initialize on import
loadEmbeddingModel().catch(console.error);
