// src/services/medicationLookup.js
// Tiered medication lookup service with IndexedDB caching

const CACHE_DB_NAME = 'medicationCacheDB';
const CACHE_STORE_NAME = 'medicationCache';
const CACHE_TTL_DAYS = 30;

/**
 * Normalize NDC code to 10-digit format (5-4-2)
 */
function normalizeNDC(ndc) {
  const digits = ndc.replace(/[^0-9]/g, '');
  
  if (digits.length === 10) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}-${digits.slice(9, 11)}`;
  }
  if (digits.length === 11) {
    // May already be formatted as 5-4-2 but with extra digit
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}-${digits.slice(9, 11)}`;
  }
  if (digits.length === 12) {
    // UPC-A: convert to NDC by dropping first digit or handling as is
    return `${digits.slice(1, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 12)}`;
  }
  return ndc;
}

/**
 * Open IndexedDB for medication cache
 */
function openCacheDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
        const store = db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'ndc' });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };
  });
}

/**
 * Check if cached entry is still valid (within TTL)
 */
function isCacheValid(cachedAt) {
  const cachedDate = new Date(cachedAt);
  const now = new Date();
  const diffDays = (now - cachedDate) / (1000 * 60 * 60 * 24);
  return diffDays < CACHE_TTL_DAYS;
}

/**
 * Get medication from cache
 */
async function getFromCache(ndc) {
  try {
    const db = await openCacheDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(CACHE_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const request = store.get(ndc);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && isCacheValid(result.cachedAt)) {
          resolve(result);
        } else {
          // Stale cache entry - delete it
          if (result) {
            const delTx = db.transaction(CACHE_STORE_NAME, 'readwrite');
            delTx.objectStore(CACHE_STORE_NAME).delete(ndc);
          }
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Cache read error:', err);
    return null;
  }
}

/**
 * Save medication to cache
 */
async function saveToCache(ndc, drugData) {
  try {
    const db = await openCacheDB();
    const entry = {
      ndc,
      ...drugData,
      cachedAt: new Date().toISOString()
    };
    
    const transaction = db.transaction(CACHE_STORE_NAME, 'readwrite');
    transaction.objectStore(CACHE_STORE_NAME).put(entry);
    
    return new Promise((resolve) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Cache write error:', err);
  }
}

/**
 * Fetch from openFDA NDC Directory
 */
async function fetchFromOpenFDA(ndc) {
  try {
    const normalizedNDC = ndc.replace(/-/g, '');
    const response = await fetch(
      `https://api.fda.gov/drug/ndc.json?search=product_ndc:"${normalizedNDC}"&limit=1`,
      { mode: 'cors' }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }
    
    const result = data.results[0];
    const brandName = result.brand_name || '';
    const genericName = result.generic_name || '';
    
    return {
      ndc: ndc,
      genericName: genericName || brandName || 'Unknown',
      brandNames: brandName ? [brandName] : [],
      dosageForm: result.dosage_form || '',
      strength: result.strength || '',
      manufacturer: result.labeler_name || '',
      route: result.route || '',
      source: 'openFDA'
    };
  } catch (err) {
    console.warn('openFDA fetch error:', err);
    return null;
  }
}

/**
 * Fetch from RxNorm API
 */
async function fetchFromRxNorm(ndc) {
  try {
    const normalizedNDC = ndc.replace(/-/g, '');
    const response = await fetch(
      `https://rxnav.nlm.nih.gov/REST/ndcproperties.json?id=${normalizedNDC}`,
      { mode: 'cors' }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const ndcProperties = data.nlmRxNav?.ndcPropertyList?.ndcProperty?.[0] || 
                          data.nlmRxNav?.ndcPropertyList?.ndcProperty;
    
    if (!ndcProperties) {
      return null;
    }
    
    const fullName = ndcProperties['fullGenericName'] || ndcProperties['fullName'] || '';
    const name = ndcProperties['displayName'] || '';
    
    return {
      ndc: ndc,
      genericName: fullName || name || 'Unknown',
      brandNames: name && name !== fullName ? [name] : [],
      dosageForm: ndcProperties['df'] || '',
      strength: ndcProperties['strength'] || '',
      manufacturer: ndcProperties['suppress'] || '',
      source: 'RxNorm'
    };
  } catch (err) {
    console.warn('RxNorm fetch error:', err);
    return null;
  }
}

/**
 * Load local drug-counseling database
 */
async function loadLocalDrugDatabase() {
  try {
    const response = await fetch('/data/drug-counseling.json', {
      cache: 'default'
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (err) {
    console.warn('Local drug database load error:', err);
    return null;
  }
}

/**
 * Search local database by NDC
 */
async function searchLocalByNDC(ndc) {
  const db = await loadLocalDrugDatabase();
  if (!db || !db.drugs) {
    return null;
  }
  
  const normalizedNDC = ndc.replace(/-/g, '');
  const drug = db.drugs.find((d) => d.ndc && d.ndc.replace(/-/g, '') === normalizedNDC);
  
  if (drug) {
    return {
      ndc: ndc,
      genericName: drug.genericName || drug.name || 'Unknown',
      brandNames: drug.brandNames || [],
      dosageForm: drug.dosageForm || '',
      strength: drug.strength || '',
      manufacturer: drug.manufacturer || '',
      notes: drug.notes || '',
      source: 'local'
    };
  }
  
  return null;
}

/**
 * Main function: Get medication by barcode (NDC/UPC)
 * Tiered lookup: cache → openFDA → RxNorm → local database
 */
export async function getMedicationByBarcode(ndc) {
  if (!ndc || typeof ndc !== 'string') {
    return null;
  }
  
  const normalizedNDC = normalizeNDC(ndc);
  
  // Tier 0: Check cache
  const cached = await getFromCache(normalizedNDC);
  if (cached) {
    return cached;
  }
  
  // Tier 1: openFDA
  let result = await fetchFromOpenFDA(normalizedNDC);
  
  // Tier 2: RxNorm
  if (!result) {
    result = await fetchFromRxNorm(normalizedNDC);
  }
  
  // Tier 3: Local database
  if (!result) {
    result = await searchLocalByNDC(normalizedNDC);
  }
  
  // If found, cache and return
  if (result) {
    await saveToCache(normalizedNDC, result);
    return result;
  }
  
  // Not found anywhere
  return {
    ndc: normalizedNDC,
    genericName: 'Unknown Medication',
    brandNames: [],
    dosageForm: '',
    strength: '',
    manufacturer: '',
    source: 'not_found'
  };
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache() {
  try {
    const db = await openCacheDB();
    const transaction = db.transaction(CACHE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CACHE_STORE_NAME);
    const index = store.index('cachedAt');
    
    const request = index.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const entry = cursor.value;
        if (!isCacheValid(entry.cachedAt)) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (err) {
    console.warn('Cache cleanup error:', err);
  }
}

/**
 * Clear all cache entries
 */
export async function clearAllCache() {
  try {
    const db = await openCacheDB();
    const transaction = db.transaction(CACHE_STORE_NAME, 'readwrite');
    transaction.objectStore(CACHE_STORE_NAME).clear();
  } catch (err) {
    console.warn('Cache clear error:', err);
  }
}