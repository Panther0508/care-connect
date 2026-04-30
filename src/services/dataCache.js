/**
 * IndexedDB-based cache for real-time data
 * Provides get, set, and freshness checking with TTL support
 */

const DB_NAME = 'VitaChainCache';
const DB_VERSION = 1;
const STORE_NAME = 'dataCache';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

function withDB(fn) {
  return openDB().then(fn).catch((err) => {
    if (import.meta.env.DEBUG) {
      console.error('[dataCache] DB error:', err);
    }
    return null;
  });
}

/**
 * Get a cached value by key
 * @param {string} key - Cache key
 * @returns {Promise<{data: any, timestamp: number, ttl: number} | null>}
 */
export async function getCached(key) {
  return withDB((db) => {
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });
}

/**
 * Set a cached value with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise<boolean>}
 */
export async function setCached(key, data, ttl) {
  return withDB((db) => {
    if (!db) return false;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
      };
      const request = store.put(record);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  });
}

/**
 * Check if a cached value is fresh (not expired)
 * @param {{data: any, timestamp: number, ttl: number} | null} cached - Cached record
 * @returns {boolean}
 */
export function isFresh(cached) {
  if (!cached) return false;
  return Date.now() - cached.timestamp < cached.ttl;
}

/**
 * Remove a cached value
 * @param {string} key - Cache key
 * @returns {Promise<boolean>}
 */
export async function removeCached(key) {
  return withDB((db) => {
    if (!db) return false;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  });
}

/**
 * Clear all cached values
 * @returns {Promise<boolean>}
 */
export async function clearCache() {
  return withDB((db) => {
    if (!db) return false;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  });
}
