// src/services/selfTrainingEngine.js
// Self-Training Engine - "Gemma teaches TinyLlama"
// Stores query-response pairs for future offline model improvement
// Based on Gemma teaching pattern from Phase 3 + AFlow research

const DB_NAME = 'vitachain-training';
const DB_VERSION = 1;
const PAIRS_STORE = 'trainingPairs';
const CYCLES_STORE = 'trainingCycles';

let dbInstance = null;

const openDB = async () => {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(PAIRS_STORE)) {
        db.createObjectStore(PAIRS_STORE, { keyPath: 'id', autoIncrement: true });
        db.createObjectStore(PAIRS_STORE).createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains(CYCLES_STORE)) {
        db.createObjectStore(CYCLES_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Log an AI interaction as training pair
 * @param {Object} data - { prompt, response, role, emotionalState, sources, reasoning, citations, modelUsed }
 */
export async function logInteraction(data) {
  const db = await openDB();
  const tx = db.transaction(PAIRS_STORE, 'readwrite');
  const store = tx.objectStore(PAIRS_STORE);

  const pair = {
    prompt: data.prompt,
    response: data.response,
    role: data.role || 'patient',
    emotionalState: data.emotionalState || 'neutral',
    sources: data.sources || [],
    reasoning: data.reasoning || null,
    citations: data.citations || [],
    modelUsed: data.modelUsed || 'unknown',
    helpful: null, // pending user feedback
    weight: 1.0,   // initial weight
    embedding: data.embedding || null,
    timestamp: Date.now()
  };

  await store.add(pair);
  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  // Auto-trigger training cycle at threshold
  const count = await getNewPairCount();
  if (count >= 50) {
    console.log(`[SelfTraining] ${count} new pairs - training cycle ready`);
  }

  return pair;
}

/**
 * Mark a training pair as helpful/unhelpful
 */
export async function ratePair(pairId, wasHelpful) {
  const db = await openDB();
  const tx = db.transaction(PAIRS_STORE, 'readwrite');
  const store = tx.objectStore(PAIRS_STORE);
  const req = store.get(pairId);

  const pair = await new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  if (pair) {
    pair.helpful = wasHelpful;
    pair.weight = wasHelpful ? pair.weight * 1.2 : pair.weight * 0.8;
    await store.put(pair);
  }

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

/**
 * Get count of new (unrated) pairs
 */
export async function getNewPairCount() {
  const db = await openDB();
  const tx = db.transaction(PAIRS_STORE, 'readonly');
  const store = tx.objectStore(PAIRS_STORE);
  const index = store.index('timestamp');

  // Get recent pairs (last 7 days approximate by sampling)
  const request = index.getAll();
  const all = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = all.filter(p => p.timestamp > weekAgo);
  return recent.length;
}

/**
 * Select diverse training pairs for a training cycle
 * Uses cosine diversity sampling on embeddings
 */
export async function selectDiversePairs(sampleSize = 200) {
  const db = await openDB();
  const tx = db.transaction(PAIRS_STORE, 'readonly');
  const store = tx.objectStore(PAIRS_STORE);
  const request = store.getAll();

    const allPairs = await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  // Filter pairs with embeddings
  const withEmbeddings = allPairs.filter(p => p.embedding);
  if (withEmbeddings.length < 50) return [];

  // Simple diversity: pick pairs with highest weight first, then add random diversity
  const sorted = [...withEmbeddings].sort((a, b) => b.weight - a.weight);

  // Greedy diversity selection
  const selected = [sorted[0]];
  const remaining = sorted.slice(1);

  while (selected.length < sampleSize && remaining.length > 0) {
    let best = null;
    let bestScore = -1;

    for (const candidate of remaining.slice(0, 50)) { // Check first 50 for efficiency
      let minSim = 1;
      for (const sel of selected) {
        const sim = cosineSimilarity(candidate.embedding, sel.embedding);
        if (sim < minSim) minSim = sim;
      }
      if (minSim > bestScore) {
        bestScore = minSim;
        best = candidate;
      }
    }

    if (best) {
      selected.push(best);
      const idx = remaining.indexOf(best);
      remaining.splice(idx, 1);
    } else {
      break;
    }
  }

  return selected.slice(0, sampleSize);
}

/**
 * Generate training data JSONL
 * This creates a downloadable dataset for fine-tuning
 */
export async function generateTrainingData(format = 'jsonl') {
  const pairs = await selectDiversePairs(200);

  if (format === 'jsonl') {
    return pairs.map(p => JSON.stringify({
      prompt: p.prompt,
      completion: p.response,
      role: p.role,
      emotionalState: p.emotionalState
    })).join('\n');
  }

  return pairs;
}

/**
 * Run a training cycle (logs it - actual training would be TF.js nanogpt)
 * This is a placeholder for the browser-native fine-tuning step
 */
export async function runTrainingCycle() {
  const pairs = await selectDiversePairs(200);

  if (pairs.length < 50) {
    throw new Error(`Need at least 50 diverse pairs; currently have ${pairs.length}`);
  }

  // Generate training data
  const trainingData = await generateTrainingData('jsonl');

  // Log cycle completion
  const db = await openDB();
  const tx = db.transaction(CYCLES_STORE, 'readwrite');
  const store = tx.objectStore(CYCLES_STORE);

  const cycle = {
    timestamp: Date.now(),
    pairsUsed: pairs.length,
    diversityScore: calculateDiversityScore(pairs),
    status: 'completed'
  };

  await store.add(cycle);
  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  console.log(`[SelfTraining] Cycle complete: ${pairs.length} pairs used`);

  // In a real implementation: trigger TensorFlow.js fine-tuning
  // For now, we just log and store the dataset
  localStorage.setItem('vita_latest_training_data', trainingData);

  return {
    success: true,
    pairsUsed: pairs.length,
    nextCycleIn: 50 - pairs.length,
    downloaded: true
  };
}

/**
 * Get training statistics
 */
export async function getTrainingStats() {
  const db = await openDB();
  const pairsTx = db.transaction(PAIRS_STORE, 'readonly');
  const pairsStore = pairsTx.objectStore(PAIRS_STORE);
  const pairsReq = pairsStore.getAll();

  const allPairs = await new Promise((resolve) => {
    pairsReq.onsuccess = () => resolve(pairsReq.result || []);
    pairsReq.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    pairsTx.oncomplete = () => resolve();
  });

  const cyclesTx = db.transaction(CYCLES_STORE, 'readonly');
  const cyclesStore = cyclesTx.objectStore(CYCLES_STORE);
  const cyclesReq = cyclesStore.getAll();

  const cycles = await new Promise((resolve) => {
    cyclesReq.onsuccess = () => resolve(cyclesReq.result || []);
    cyclesReq.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    cyclesTx.oncomplete = () => resolve();
  });

  return {
    totalPairs: allPairs.length,
    newPairsThisWeek: allPairs.filter(p => p.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
    lastCycle: cycles[cycles.length - 1] || null,
    totalCycles: cycles.length
  };
}

// Utility: cosine similarity
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

// Calculate dataset diversity score
function calculateDiversityScore(pairs) {
  if (pairs.length < 2) return 0;
  const sims = [];
  for (let i = 0; i < Math.min(20, pairs.length); i++) {
    for (let j = i + 1; j < Math.min(20, pairs.length); j++) {
      sims.push(cosineSimilarity(pairs[i].embedding, pairs[j].embedding));
    }
  }
  const avgSim = sims.reduce((a, b) => a + b, 0) / sims.length;
  return Math.round((1 - avgSim) * 100); // Higher = more diverse
}

export default {
  logInteraction,
  ratePair,
  getNewPairCount,
  selectDiversePairs,
  generateTrainingData,
  runTrainingCycle,
  getTrainingStats
};
