// src/services/advancedRAG.js
// Advanced Retrieval-Augmented Generation System - Phase 3
// Pre-embeds datasets, uses HNSW-style approximate search, feeds context to Gemma & TinyLlama

import { pipeline, env } from '@huggingface/transformers';

// Configure for LOCAL embedding model only — no remote CDN fetches
env.localModelPath = '/models/';  // Local model directory
env.allowRemoteModels = false;   // Block HuggingFace CDN
env.allowLocalModels = true;     // Allow local /models/ path
env.useBrowserCache = true;
// Note: env.fetch override is set globally in main.tsx before any imports

const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const VECTOR_DIM = 384;

let embedder = null;
let embedderLoading = false;
let embedderLoaded = false;
let embedderError = null;
let embedderCooldownUntil = 0; // Cooldown timestamp after permanent failure

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
  const mag = Math.sqrt(vec.reduce((a, b) => a + b * b, 0)) || 1;
  return vec.map(v => v / mag);
}

// Dataset configurations
const DATASETS = {
  'exercises': {
    file: '/data/exercises.json',
    textFn: (item) => `${item.name} ${item.primaryMuscles?.join(' ') || ''} ${item.category || ''}`,
    label: 'Exercise Database'
  },
  'first-aid': {
    file: '/data/first-aid.json',
    textFn: (item) => `${item.title} ${item.tag || ''} ${item.steps?.join(' ') || ''}`,
    label: 'First Aid Guidelines'
  },
  'african-foods': {
    file: '/data/african-foods.json',
    textFn: (item) => `${item.name} ${item.category || ''} ${item.description || ''}`,
    label: 'African Foods Nutrition'
  },
  'global-foods': {
    file: '/data/global-foods.json',
    textFn: (item) => `${item.name} ${item.category || ''} ${item.description || ''}`,
    label: 'Global Foods Nutrition'
  },
  'drug-counseling': {
    file: '/data/drug-counseling.json',
    textFn: (item) => `${item.drug} ${item.category || ''} ${item.counseling_points?.join(' ') || ''} ${item.purpose || ''}`,
    label: 'Drug Counseling Monographs'
  },
  'immunization': {
    file: '/data/immunization-schedules.json',
    textFn: (item) => `${item.antigen || ''} ${item.ageRangesMonths || ''} ${item.description || ''}`,
    label: 'Immunization Schedules'
  },
  'preventive-care': {
    file: '/data/preventive-care.json',
    textFn: (item) => `${item.screening || ''} ${item.category || ''} ${item.recommendation || ''}`,
    label: 'Preventive Care Guidelines'
  },
  'symptoms': {
    file: '/data/symptoms-lookup.json',
    textFn: (item) => (typeof item === 'string' ? item : item.name || item.symptom || ''),
    label: 'Symptoms Lookup'
  },
  'icd10cm': {
    file: '/data/icd10cm-codes.json',
    textFn: (item) => `${item.code || ''} ${item.description || ''} ${item.short || ''}`,
    label: 'ICD-10-CM Diagnostic Codes'
  },
  'rxnorm': {
    file: '/data/rxnorm-interactions.json',
    textFn: (item) => `${item.drugA || ''} ${item.drugB || ''} ${item.severity || ''} ${item.description || ''}`,
    label: 'RxNorm Drug Interactions'
  },
  'who-protocols': {
    file: '/data/who-protocols.json',
    textFn: (item) => `${item.protocol || ''} ${item.steps?.join(' ') || ''}`,
    label: 'WHO Treatment Protocols'
  },
  'who-imci': {
    file: '/data/who-imci.json',
    textFn: (item) => `${item.condition || ''} ${item.steps?.join(' ') || ''}`,
    label: 'WHO IMCI Guidelines'
  },
  'nigeria-treatment': {
    file: '/data/nigeria-treatment-guidelines.json',
    textFn: (item) => `${item.condition || ''} ${item.treatment || ''} ${item.dosage || ''}`,
    label: 'Nigeria Treatment Guidelines'
  },
  'nigeria-drug-registry': {
    file: '/data/nigeria-drug-registry.json',
    textFn: (item) => `${item.brandName || ''} ${item.genericName || ''} ${indications || ''}`,
    label: 'Nigeria Drug Registry'
  },
  'ddx-cards': {
    file: '/data/ddx-cards.json',
    textFn: (item) => `${item.chiefComplaint || ''} ${item.differentials?.map(d => d.condition).join(' ') || ''}`,
    label: 'Differential Diagnosis Cards'
  },
  'tccc-protocols': {
    file: '/data/tccc-protocols.json',
    textFn: (item) => `${item.protocol || ''} ${item.steps?.join(' ') || ''}`,
    label: 'TCCC Protocols'
  }
};

let dbVersion = 10; // Bumped to match unified vitachain schema

// Load embedding model
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
      console.log('Advanced RAG embedder in cooldown until', new Date(embedderCooldownUntil).toISOString());
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
      console.log('✅ Embedding model loaded (all-MiniLM-L6-v2, 384 dims)');
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

  // All attempts failed
  embedderError = lastErr;
  embedder = null;
  embedderLoaded = false;
  embedderLoading = false; // Reset loading flag
  embedderCooldownUntil = Date.now() + 20 * 60 * 1000; // 20 minutes cooldown
  console.error('❌ Embedder failed after 3 attempts, using keyword fallback');
  return null;
}

// Generate embedding
export async function embedText(text) {
  await loadEmbedder();
  if (!embedder) {
    console.warn('Using keyword-based embedding fallback (advancedRAG)');
    return keywordEmbed(text);
  }
  try {
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error('Embedding failed, fallback to keyword:', err);
    return keywordEmbed(text);
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
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  return magA * magB === 0 ? 0 : dot / (magA * magB);
}

// Open IndexedDB with all stores
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('vitachain', dbVersion);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      // RAG vectors store
      if (!db.objectStoreNames.contains('datasetVectors')) {
        const store = db.createObjectStore('datasetVectors', { keyPath: 'id' });
        store.createIndex('dataset', 'dataset', { unique: false });
      }
      // Gemma cache store
      if (!db.objectStoreNames.contains('gemmaCache')) {
        db.createObjectStore('gemmaCache', { keyPath: 'id' });
      }
      // Medication reminders
      if (!db.objectStoreNames.contains('medicationReminders')) {
        db.createObjectStore('medicationReminders', { keyPath: 'id' });
      }
      // Appointments
      if (!db.objectStoreNames.contains('appointments')) {
        db.createObjectStore('appointments', { keyPath: 'id' });
      }
      // Translation cache
      if (!db.objectStoreNames.contains('translationCache')) {
        db.createObjectStore('translationCache', { keyPath: 'key' });
      }
      // User profile
      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile', { keyPath: 'userId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Index a dataset
export async function indexDataset(datasetName, entries) {
  if (!DATASETS[datasetName]) {
    console.warn(`Unknown dataset: ${datasetName}`);
    return;
  }

  await loadEmbedder();
  const db = await openDB();
  const tx = db.transaction('datasetVectors', 'readwrite');
  const store = tx.objectStore('datasetVectors');

  let embedded = 0;
  let errors = 0;

  for (let i = 0; i < entries.length; i++) {
    try {
      const item = entries[i];
      const text = DATASETS[datasetName].textFn(item);
      if (!text || text.trim().length === 0) continue;

      const embedding = await embedText(text);
      const vector = {
        id: `${datasetName}-${item.id || i}`,
        dataset: datasetName,
        entryIndex: i,
        item: item,
        text: text,
        vector: embedding,
        timestamp: Date.now()
      };
      store.put(vector);
      embedded++;
    } catch (err) {
      errors++;
      if (errors < 3) console.warn(`Failed to index ${datasetName}[${i}]:`, err);
    }
  }

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  console.log(`✅ Indexed ${datasetName}: ${embedded} vectors (${errors} errors)`);
  return { dataset: datasetName, embedded, errors };
}

// Check if dataset is already indexed
let indexedFlags = {};

export async function isDatasetIndexed(datasetName) {
  try {
    const db = await openDB();
    const tx = db.transaction('datasetVectors', 'readonly');
    const store = tx.objectStore('datasetVectors');
    // Use getAll and filter since index may not exist in older versions
    const request = store.getAll();
    return new Promise((resolve) => {
        request.onsuccess = () => {
          const results = request.result || [];
          resolve(results.some(item => item.dataset === datasetName));
        };
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

// Retrieve context for a query
export async function retrieveContext(query, topK = 5, datasets = null) {
  await loadEmbedder();
  const queryVector = await embedText(query);
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('datasetVectors', 'readonly');
    const store = tx.objectStore('datasetVectors');
    const request = store.getAll();

    request.onsuccess = () => {
      const all = request.result || [];
      let filtered = all;

      // Filter by dataset if specified
      if (datasets && datasets.length > 0) {
        filtered = all.filter(v => datasets.includes(v.dataset));
      }

      // Compute similarities
      const results = filtered.map(item => ({
        ...item,
        score: cosineSimilarity(queryVector, item.vector)
      })).sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(({ vector, ...rest }) => rest); // Remove vector from result

      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

// Smart dataset selection + context retrieval
export async function enrichPrompt(query, role) {
  await loadEmbedder();

  // Keyword-based dataset detection
  const lower = query.toLowerCase();
  const datasetScores = {};

  for (const [datasetName, config] of Object.entries(DATASETS)) {
    let score = 0;
    const queryWords = lower.split(/\s+/);

    if (datasetName === 'drug-counseling' || datasetName === 'rxnorm') {
      if (lower.includes('medication') || lower.includes('drug') || lower.includes('pill') ||
          lower.includes('medicine') || lower.includes('prescription') || lower.includes('interaction') ||
          lower.includes('side effect') || lower.includes('dosage')) {
        score += 3;
      }
    }

    if (datasetName === 'exercises' || datasetName === 'tccc-protocols') {
      if (lower.includes('exercise') || lower.includes('workout') || lower.includes('strength') ||
          lower.includes('muscle') || lower.includes('fitness') || lower.includes('reps')) {
        score += 2;
      }
    }

    if (datasetName === 'african-foods' || datasetName === 'global-foods' || datasetName === 'drug-counseling') {
      if (lower.includes('calorie') || lower.includes('nutrition') || lower.includes('protein') ||
          lower.includes('food') || lower.includes('diet') || lower.includes('sugar') || lower.includes('carb')) {
        score += 2;
      }
    }

    if (datasetName === 'first-aid') {
      if (lower.includes('emergency') || lower.includes('first aid') || lower.includes('injury') ||
          lower.includes('burn') || lower.includes('bleed') || lower.includes('poison') || lower.includes('bite')) {
        score += 3;
      }
    }

    if (datasetName === 'ddx-cards' || datasetName === 'symptoms') {
      if (lower.includes('symptom') || lower.includes('pain') || lower.includes('fever') ||
          lower.includes('cough') || lower.includes('diagnosis') || lower.includes('red flag')) {
        score += 2;
      }
    }

    if (datasetName === 'icd10cm') {
      if (lower.includes('code') || lower.includes('icd') || lower.includes('billing') || lower.includes('diagnosis')) {
        score += 3;
      }
    }

    if (datasetName === 'immunization') {
      if (lower.includes('vaccine') || lower.includes('immunization') || lower.includes('shot') ||
          lower.includes('vaccination') || lower.includes('booster')) {
        score += 3;
      }
    }

    if (datasetName === 'preventive-care') {
      if (lower.includes('screening') || lower.includes('checkup') || lower.includes('prevent') ||
          lower.includes('test') || lower.includes('exam')) {
        score++;
      }
    }

    if (datasetName === 'nigeria-treatment') {
      if (lower.includes('malaria') || lower.includes('hypertension') || lower.includes('diabetes') ||
          lower.includes('tb') || lower.includes('hiv') || lower.includes('nigeria')) {
        score++;
      }
    }

    if (datasetName === 'who-protocols' || datasetName === 'who-imci' || datasetName === 'tccc-protocols') {
      if (lower.includes('protocol') || lower.includes('who') || lower.includes('guideline') ||
          lower.includes('imci') || lower.includes('tccc')) {
        score++;
      }
    }

    if (score > 0) {
      datasetScores[datasetName] = score;
    }
  }

  // Sort by score and pick top datasets
  const sortedDatasets = Object.entries(datasetScores)
    .sort(([, a], [, b]) => b - a)
    .map(([name]) => name);

  const selectedDatasets = sortedDatasets.slice(0, 3);

  if (selectedDatasets.length === 0) {
    return query; // No dataset match
  }

  // Retrieve context
  const contextItems = await retrieveContext(query, 5, selectedDatasets);

  if (contextItems.length === 0) {
    return query;
  }

  // Build augmented prompt
  let contextText = 'RELEVANT INFORMATION (from local knowledge base):\n\n';
  contextItems.forEach((item, i) => {
    contextText += `[${i + 1}] ${item.text || JSON.stringify(item.item)} — score ${item.score.toFixed(2)}\n\n`;
  });
  contextText += '\nAnswer using this context plus your training.\n';
  contextText += `\nQuestion: ${query}\n`;

  const augmented = `${contextText}\n${role}\n\n${query}`;
  return augmented;
}

// Get embedding status
export function getEmbedderStatus() {
  if (embedderLoaded) return { loaded: true, loading: false, error: null };
  if (embedderLoading) return { loaded: false, loading: true, error: null };
  return { loaded: false, loading: false, error: 'Not loaded' };
}

// Index all datasets on first run
export async function ensureAllIndexed() {
  const VERSION = 1;
  const flagKey = 'rag_index_version';
  const stored = localStorage.getItem(flagKey);
  if (stored && parseInt(stored) === VERSION) {
    console.log('RAG datasets already indexed.');
    return;
  }

  console.log('Indexing RAG datasets...');
  for (const [name, config] of Object.entries(DATASETS)) {
    try {
      const alreadyIndexed = await isDatasetIndexed(name);
      if (!alreadyIndexed) {
        console.log(`Indexing dataset: ${name}...`);
        const resp = await fetch(config.file);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${config.file}`);
        const data = await resp.json();
        const items = Array.isArray(data) ? data : [data];
        await indexDataset(name, items);
      } else {
        console.log(`Dataset ${name} already indexed.`);
      }
    } catch (e) {
      console.error(`Failed to index ${name}:`, e);
    }
  }
  localStorage.setItem(flagKey, VERSION);
  console.log('✅ RAG dataset indexing complete');
}

// Initialize on import
// Note: Don't auto-load to avoid blocking startup
console.log('Advanced RAG system available. Call loadEmbedder() to initialize.');