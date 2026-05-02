// src/services/webSearchService.js
// TIERED WEB SEARCH — LangSearch (primary) → SearXNG (fallback) → DuckDuckGo (final)
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
        await cacheResults(normalizedQuery, results);
        return results;
      }
    }
  } catch (err) {
    console.warn('LangSearch failed:', err.message);
  }

  // Tier 2: SearXNG Public Instances
  try {
    const searxResults = await searchSearXNG(normalizedQuery, maxResults);
    if (searxResults.length > 0) {
      await cacheResults(normalizedQuery, searxResults);
      return searxResults;
    }
  } catch (err) {
    console.warn('SearXNG failed:', err.message);
  }

  // Tier 3: DuckDuckGo Instant Answer
  try {
    const ddgResults = await searchDuckDuckGo(normalizedQuery, maxResults);
    if (ddgResults.length > 0) {
      await cacheResults(normalizedQuery, ddgResults);
      return ddgResults;
    }
  } catch (err) {
    console.warn('DuckDuckGo failed:', err.message);
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
 * Tier 2: SearXNG Public Instances (HTML scraping)
 * GET https://{instance}/search?q={query}&language=en
 * Parse <article class="result"> blocks
 */
async function searchSearXNG(query, maxResults = 5) {
  const instances = (import.meta.env.VITE_SEARXNG_INSTANCES || '')
    .split(',')
    .map(i => i.trim())
    .filter(i => i.length > 0);

  if (instances.length === 0) {
    throw new Error('VITE_SEARXNG_INSTANCES not configured');
  }

  // Try up to 5 instances before giving up
  const attempts = Math.min(5, instances.length);
  const encodedQuery = encodeURIComponent(query);

  for (let i = 0; i < attempts; i++) {
    const instance = instances[i];
    const url = `${instance}/search?q=${encodedQuery}&language=en`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per instance

      const resp = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'text/html' }
      });
      clearTimeout(timeoutId);

      if (!resp.ok) continue;

      const html = await resp.text();
      const results = parseSearXNGHTML(html, maxResults);

      if (results.length > 0) {
        console.log('✅ SearXNG success via:', instance);
        return results.map(r => ({
          ...r,
          source: 'SearXNG'
        }));
      }
    } catch (err) {
      console.warn(`SearXNG instance ${instance} failed:`, err.message);
    }
  }

  throw new Error('All SearXNG instances failed or returned no results');
}

/**
 * Parse SearXNG HTML response
 * SearXNG standard markup: <article class="result"> … <h3> title </h3> … <a href="url"> … <p> snippet </p>
 */
function parseSearXNGHTML(html, maxResults = 5) {
  const results = [];

  // Use DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find all <article class="result"> elements
  const articles = doc.querySelectorAll('article.result');

  articles.forEach(article => {
    if (results.length >= maxResults) return;

    // Extract title and URL from the first <a> in <h3> or <h4>
    const titleEl = article.querySelector('h3, h4');
    const linkEl = article.querySelector('a');
    const snippetEl = article.querySelector('p, .content, .snippet');

    if (titleEl && linkEl) {
      const title = titleEl.textContent?.trim() || '';
      const url = linkEl.getAttribute('href') || '';
      const snippet = snippetEl?.textContent?.trim() || '';

      if (title && url) {
        results.push({ title, url, snippet });
      }
    }
  });

  return results;
}

/**
 * Tier 3: DuckDuckGo Instant Answer API
 * GET https://api.duckduckgo.com/?q={query}&format=json
 * Returns: { AbstractText, AbstractURL, Heading, RelatedTopics: [{Text, FirstURL}] }
 */
async function searchDuckDuckGo(query, maxResults = 5) {
  const encoded = encodeURIComponent(query);
  const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;

  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });

  if (!resp.ok) {
    throw new Error(`DuckDuckGo HTTP ${resp.status}`);
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
          title: topic.Text.split(' — ')[0] || topic.Text, // Take first part as title
          url: topic.FirstURL,
          snippet: topic.Text,
          source: 'DuckDuckGo'
        });
      }
    });
  }

  return results.slice(0, maxResults);
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
  searchSearXNG,
  searchDuckDuckGo
};
