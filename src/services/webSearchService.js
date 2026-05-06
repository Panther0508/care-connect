// src/services/webSearchService.js
// TIERED WEB SEARCH — LangSearch (primary) → DuckDuckGo (fallback) → Wikipedia (final)
// All results normalized to { title, url, snippet, source } format
// Includes 1-hour IndexedDB cache to avoid redundant calls

import { openDB } from '../lib/idb';

const SEARCH_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const LANGSEARCH_URL = 'https://api.langsearch.com/v1/web-search';

/**
 * Main entry point: searchWeb(query, maxResults)
 * Attempts Tier 1 → Tier 2 → Tier 3 in order
 *
 * @param {string} query - Search query
 * @param {number} maxResults - Max results to return (default 5)
 * @returns {Promise<Array<{title, url, snippet, source}>>}
 */
export async function searchWeb(query, maxResults = 5) {
  if (!query || !query.trim()) return [];

  const normalizedQuery = query.trim();

  // Check cache first
  const cached = await getCachedResults(normalizedQuery);
  if (cached) {
    console.log('🔁 Search cache hit:', normalizedQuery);
    return cached;
  }

   // Tier 1: LangSearch
   try {
     const langKey = import.meta.env.VITE_LANGSEARCH_API_KEY;
     if (langKey) {
       const results = await searchLangSearch(normalizedQuery, maxResults);
       if (results.length > 0) {
         try {
           await cacheResults(normalizedQuery, results);
         } catch (cacheErr) {
           console.warn('Cache write failed (non-critical):', cacheErr);
         }
         return results;
       }
     }
   } catch (err) {
     console.warn('LangSearch failed:', err.message);
   }

   // Tier 2: DuckDuckGo Instant Answer
   try {
     const ddgResults = await searchDuckDuckGo(normalizedQuery, maxResults);
     if (ddgResults.length > 0) {
       try {
         await cacheResults(normalizedQuery, ddgResults);
       } catch (cacheErr) {
         console.warn('Cache write failed (non-critical):', cacheErr);
       }
       return ddgResults;
     }
   } catch (err) {
     console.warn('DuckDuckGo failed:', err.message);
   }

   // Tier 3: Wikipedia API (free, no key required)
   try {
     const wikiResults = await searchWikipedia(normalizedQuery, maxResults);
     if (wikiResults.length > 0) {
       try {
         await cacheResults(normalizedQuery, wikiResults);
       } catch (cacheErr) {
         console.warn('Cache write failed (non-critical):', cacheErr);
       }
       return wikiResults;
     }
   } catch (err) {
     console.warn('Wikipedia search failed:', err.message);
   }

  // All tiers failed — return empty array
  console.error('All search tiers failed for query:', normalizedQuery);
  return [];
}

/**
 * Tier 1: LangSearch API
 * POST https://api.langsearch.com/v1/web-search
 * Headers: Authorization: Bearer {key}
 * Body: { query, freshness: "noLimit", summary: true, count }
 */
async function searchLangSearch(query, maxResults = 5) {
  const apiKey = import.meta.env.VITE_LANGSEARCH_API_KEY;
  if (!apiKey) throw new Error('VITE_LANGSEARCH_API_KEY not set');

  const body = {
    query,
    freshness: 'noLimit',
    summary: true,
    count: Math.min(maxResults, 20)
  };

  const resp = await fetch(LANGSEARCH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    throw new Error(`LangSearch HTTP ${resp.status}`);
  }

  const data = await resp.json();

  // LangSearch response format: { results: [{ title, url, content, snippet? }] }
  const results = data.results || data.web?.results || [];

  return results.map(r => ({
    title: r.title || '',
    url: r.url || '',
    snippet: r.snippet || r.content || r.description || '',
    source: 'LangSearch'
  })).filter(r => r.title && r.url);
}

/**
 * Tier 2: DuckDuckGo Instant Answer API via CORS proxy
 * GET /api/proxy → forward to https://api.duckduckgo.com/
 */
async function searchDuckDuckGo(query, maxResults = 5) {
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;

  const resp = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl })
  });

  if (!resp.ok) {
    throw new Error(`DuckDuckGo via proxy HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const results = [];

  // AbstractText (Wikipedia-style summary)
  if (data.AbstractText) {
    results.push({
      title: data.Heading || query,
      url: data.AbstractURL || '',
      snippet: data.AbstractText,
      source: 'DuckDuckGo'
    });
  }

  // RelatedTopics (up to 3 more)
  if (Array.isArray(data.RelatedTopics) && results.length < maxResults) {
    const topics = data.RelatedTopics.slice(0, maxResults - results.length);
    topics.forEach(topic => {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.split(' — ')[0] || topic.Text,
          url: topic.FirstURL,
          snippet: topic.Text,
          source: 'DuckDuckGo'
        });
      }
    });
  }

  return results.slice(0, maxResults);
}

/**
 * Tier 3: Wikipedia API (free, no auth required) via CORS proxy
 * GET /api/proxy → forward to https://en.wikipedia.org/w/api.php
 */
async function searchWikipedia(query, maxResults = 5) {
  const encoded = encodeURIComponent(query);
  const targetUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encoded}&limit=${maxResults}&format=json&namespace=0`;

  const resp = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl })
  });

  if (!resp.ok) {
    throw new Error(`Wikipedia via proxy HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const [_, titles, descriptions, urls] = data;

  const results = [];
  for (let i = 0; i < titles.length && i < maxResults; i++) {
    results.push({
      title: titles[i],
      url: urls[i],
      snippet: descriptions[i] || '',
      source: 'Wikipedia'
    });
  }

  return results;
}

// ==================== IndexedDB Caching ====================

async function getCachedResults(query) {
  try {
    const db = await openDB();
    const tx = db.transaction('searchCache', 'readonly');
    const store = tx.objectStore('searchCache');
    const request = store.get(query);

    const record = await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });

    if (record && (Date.now() - record.timestamp < SEARCH_CACHE_TTL)) {
      return record.results;
    }

    // Stale cache — delete it
    if (record) {
      const deleteTx = db.transaction('searchCache', 'readwrite');
      deleteTx.objectStore('searchCache').delete(query);
    }

    return null;
  } catch (err) {
    console.warn('Search cache read failed:', err);
    return null;
  }
}

async function cacheResults(query, results) {
  if (!results || results.length === 0) return;

  try {
    const db = await openDB();
    const tx = db.transaction('searchCache', 'readwrite');
    const store = tx.objectStore('searchCache');
    await store.put({
      query: query,
      results,
      timestamp: Date.now()
    });
    await tx.done;
  } catch (err) {
    console.warn('Search cache write failed:', err);
  }
}

export default {
  searchWeb,
  searchLangSearch,
  searchDuckDuckGo,
  searchWikipedia
};
