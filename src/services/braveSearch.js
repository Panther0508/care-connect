// src/services/braveSearch.js
// Brave Search API - Free tier: 2,000 queries/month, $5 monthly credit, no credit card
// https://brave.com/search/api/

const API_KEY = import.meta.env.VITE_BRAVE_API_KEY;
const BASE_URL = 'https://api.search.brave.com/res/v1/web/search';

/**
 * Search Brave Web Search
 * @param {string} query - Search query
 * @param {number} count - Number of results (default 5, max 20)
 * @returns {Promise<Array<{title, url, snippet, thumbnail}>>}
 */
export async function searchBrave(query, count = 5) {
  if (!API_KEY) {
    console.warn('VITE_BRAVE_API_KEY not set - skipping Brave Search');
    return [];
  }

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('count', Math.min(count, 20).toString());
    url.searchParams.set('safesearch', 'moderate');

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Brave Search API: ${response.status}`);
    }

    const data = await response.json();
    const results = data.web?.results || [];

    return results.map(r => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.description || r.snippet || '',
      thumbnail: r.thumbnail?.src || null,
      source: 'Brave Search'
    }));
  } catch (err) {
    console.error('Brave Search failed:', err);
    return [];
  }
}

/**
 * Search Brave for medical information only
 */
export async function searchBraveMedical(query, count = 5) {
  const medicalTerms = [
    'health', 'medical', 'medicine', 'treatment', 'clinic',
    'hospital', 'doctor', 'symptom', 'diagnosis', 'drug',
    'medication', 'vaccine', 'disease', 'condition', 'therapy'
  ];

  const lowerQuery = query.toLowerCase();
  const isMedical = medicalTerms.some(term => lowerQuery.includes(term));

  if (!isMedical) {
    return []; // Only use Brave for medical queries
  }

  const results = await searchBrave(query + ' medical health', count);

  // Filter to reputable medical sources
  const reputableDomains = [
    'nih.gov', 'cdc.gov', 'who.int', 'mayoclinic.org',
    'webmd.com', 'medlineplus.gov', 'healthline.com',
    'hopkinsmedicine.org', 'clevelandclinic.org'
  ];

  return results.filter(r => {
    try {
      const domain = new URL(r.url).hostname;
      return reputableDomains.some(d => domain.includes(d.replace('www.', '')));
    } catch {
      return false;
    }
  }).slice(0, count);
}

export default {
  searchBrave,
  searchBraveMedical
};
