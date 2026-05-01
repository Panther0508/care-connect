// src/services/ragEngine.js
// Retrieval-Augmented Generation pipeline using feature-extraction pipeline
// Embeds datasets and queries using all-MiniLM-L6-v2 model

import { pipeline, env } from '@huggingface/transformers';
import { openDB } from '../lib/idb';

env.allowLocalModels = true;
env.useBrowserCache = true;

let embedder = null;
let embedderLoading = false;
let embedderLoaded = false;
let embedderError = null;

const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const VECTOR_DIM = 384; // all-MiniLM-L6-v2 produces 384-dim vectors

/**
 * Load the embedding model
 */
export async function loadEmbeddingModel() {
  if (embedderLoaded) return embedder;
  if (embedderLoading) {
    while (embedderLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (embedderError) throw embedderError;
    return embedder;
  }

  embedderLoading = true;
  try {
    embedder = await pipeline('feature-extraction', EMBEDDING_MODEL, {
      progress_callback: (progress) => {
        console.log(`Embedding model: ${Math.round((progress.loaded || 0) / (progress.total || 1) * 100)}%`);
      }
    });
    embedderLoaded = true;
    console.log('✅ Embedding model loaded (all-MiniLM-L6-v2)');
  } catch (err) {
    console.error('Failed to load embedding model:', err);
    embedderError = err;
    throw err;
  } finally {
    embedderLoading = false;
  }
  return embedder;
}

/**
 * Generate embedding for a text string
 */
export async function embedText(text) {
  if (!embedder) await loadEmbeddingModel();
  try {
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data);
    return vector;
  } catch (err) {
    console.error('Embedding failed:', err);
    throw err;
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
