// src/services/gemmaCache.js
// Gemma 4 Response Cache Service - Phase 3
// Stores every online Gemma response as embedding for offline retrieval

import { embedText } from './hybridAIRouter.js';

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Open DB connection
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('vitachain', 9); // Unified to v9
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('gemmaCache')) {
        db.createObjectStore('gemmaCache', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Cosine similarity helper
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
 * Cache a Gemma 4 response with embedded prompt
 */
export async function cacheGemmaResponse(prompt, promptVector, response) {
  try {
    const db = await openDB();
    const tx = db.transaction('gemmaCache', 'readwrite');
    const store = tx.objectStore('gemmaCache');

    const vector = promptVector || await embedText(prompt).catch(() => null);

    const record = {
      id: `gemma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prompt,
      promptVector: vector,
      response,
      model: 'gemma4-31b',
      timestamp: Date.now()
    };

    store.put(record);
    await tx.done;
    return true;
  } catch (err) {
    console.warn('Failed to cache Gemma response:', err);
    return false;
  }
}

/**
 * Search cached Gemma responses by query similarity
 */
export async function searchCachedResponses(queryVector, threshold = 0.75) {
  try {
    const db = await openDB();
    const tx = db.transaction('gemmaCache', 'readonly');
    const store = tx.objectStore('gemmaCache');
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const all = request.result || [];
        const results = all
          .filter(item => item.promptVector && item.promptVector.length > 0)
          .map(item => ({
            response: item.response,
            timestamp: item.timestamp,
            similarity: cosineSimilarity(queryVector, item.promptVector)
          }))
          .filter(r => r.similarity >= threshold)
          .sort((a, b) => b.similarity - a.similarity);
        resolve(results);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Failed to search cache:', err);
    return [];
  }
}

/**
 * Purge expired cache entries (older than TTL)
 */
export async function purgeExpiredCache() {
  try {
    const db = await openDB();
    const tx = db.transaction('gemmaCache', 'readwrite');
    const store = tx.objectStore('gemmaCache');
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const all = request.result || [];
        const now = Date.now();
        let purged = 0;

        all.forEach(item => {
          if (now - item.timestamp > CACHE_TTL) {
            store.delete(item.id);
            purged++;
          }
        });

        resolve(purged);
      };
      request.onerror = () => resolve(0);
    });
  } catch (err) {
    console.warn('Failed to purge cache:', err);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const db = await openDB();
    const tx = db.transaction('gemmaCache', 'readonly');
    const store = tx.objectStore('gemmaCache');
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const all = request.result || [];
        const timestamps = all.map(i => i.timestamp);

        resolve({
          totalCached: all.length,
          oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
          newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null
        });
      };
      request.onerror = () => resolve({ totalCached: 0, oldestEntry: null, newestEntry: null });
    });
  } catch (err) {
    return { totalCached: 0, oldestEntry: null, newestEntry: null };
  }
}

/**
 * Clear all cached responses
 */
export async function clearCache() {
  try {
    const db = await openDB();
    const tx = db.transaction('gemmaCache', 'readwrite');
    const store = tx.objectStore('gemmaCache');
    store.clear();
    await tx.done;
    return true;
  } catch (err) {
    console.warn('Failed to clear cache:', err);
    return false;
  }
}

export default {
  cacheGemmaResponse,
  searchCachedResponses,
  purgeExpiredCache,
  getCacheStats,
  clearCache
};