// AI Autonomous Self-Enrichment Engine
// Runs background knowledge worker after primary AI responses

import { openDB } from 'idb';

const DB_NAME = 'vitachain-enrichment';
const DB_VERSION = 1;

let dbPromise = null;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('enrichmentLog')) {
          const store = db.createObjectStore('enrichmentLog', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('enrichmentCache')) {
          db.createObjectStore('enrichmentCache', { keyPath: 'topicHash' });
        }
        if (!db.objectStoreNames.contains('enrichmentSettings')) {
          db.createObjectStore('enrichmentSettings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
};

// Get enrichment permission setting
export const getEnrichmentEnabled = async () => {
  const db = await initDB();
  const setting = await db.get('enrichmentSettings', 'enabled');
  return setting?.value !== false; // Default true
};

// Set enrichment permission
export const setEnrichmentEnabled = async (enabled) => {
  const db = await initDB();
  await db.put('enrichmentSettings', { key: 'enabled', value: enabled });
};

// Check if we have enough API credits remaining
export const checkEnrichmentCredits = async () => {
  // Get daily quota from gemmaCache or local storage
  const quota = parseInt(localStorage.getItem('geminiDailyQuota') || '1500');
  const used = parseInt(localStorage.getItem('geminiUsedToday') || '0');
  return (quota - used) >= 15; // Need at least 15 credits for enrichment
};

// Generate related queries for enrichment
const generateEnrichmentQueries = (originalQuery) => {
  const topics = [
    `${originalQuery} drug interactions`,
    `${originalQuery} contraindications`,
    `${originalQuery} dosing guidelines`,
    `${originalQuery} side effects management`,
    `${originalQuery} in pregnancy`,
    `${originalQuery} in breastfeeding`,
    `${originalQuery} cost and availability`,
    `${originalQuery} resistance patterns`,
    `${originalQuery} storage and stability`,
    `${originalQuery} follow up monitoring`,
  ];
  return topics;
};

// Hash topic for caching
const hashTopic = (topic) => {
  let hash = 0;
  for (let i = 0; i < topic.length; i++) {
    const char = topic.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `enrich_${Math.abs(hash)}`;
};

// Call Gemini API for enrichment
const fetchEnrichment = async (query) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Provide a concise, factual answer (2-3 sentences max) about: ${query}. Focus on clinical relevance, dosing, contraindications, or safety considerations. Be direct and evidence-based.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
          },
        }),
      }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.warn('Enrichment fetch failed:', err);
    return null;
  }
};

// Main enrichment function
export const enrichQuery = async (originalQuery, primaryResponse) => {
  // Check permissions
  const enabled = await getEnrichmentEnabled();
  if (!enabled) return { skipped: true, reason: 'disabled' };
  
  // Check online status and credits
  if (!navigator.onLine) return { skipped: true, reason: 'offline' };
  const hasCredits = await checkEnrichmentCredits();
  if (!hasCredits) return { skipped: true, reason: 'low_credits' };
  
  const db = await initDB();
  const queries = generateEnrichmentQueries(originalQuery);
  const results = [];
  let totalTokens = 0;
  
  for (const query of queries) {
    const topicHash = hashTopic(query);
    
    // Check cache first
    const cached = await db.get('enrichmentCache', topicHash);
    if (cached && cached.expires > Date.now()) {
      results.push({ query, response: cached.response, cached: true });
      continue;
    }
    
    // Fetch fresh enrichment
    const response = await fetchEnrichment(query);
    if (response) {
      await db.put('enrichmentCache', {
        topicHash,
        query,
        response,
        expires: Date.now() + (24 * 60 * 60 * 1000), // 24h TTL
      });
      
      results.push({ query, response, cached: false });
      totalTokens += 50; // Estimate token usage
    }
    
    // Update used quota
    const used = parseInt(localStorage.getItem('geminiUsedToday') || '0');
    localStorage.setItem('geminiUsedToday', String(used + 50));
  }
  
  // Log enrichment activity
  const logEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    originalQuery,
    queriesGenerated: queries.length,
    resultsCount: results.length,
    tokensUsed: totalTokens,
  };
  
  await db.put('enrichmentLog', logEntry);
  
  return {
    completed: true,
    queries: results,
    tokensUsed: totalTokens,
  };
};

// Get recent enrichment log entries
export const getEnrichmentLog = async (limit = 50) => {
  const db = await initDB();
  const all = await db.getAllFromIndex('enrichmentLog', 'timestamp');
  return all.slice(-limit).reverse();
};

// Get enrichment stats for dashboard
export const getEnrichmentStats = async () => {
  const log = await getEnrichmentLog(100);
  const today = new Date().setHours(0, 0, 0, 0);
  const todayEnrichments = log.filter(e => e.timestamp >= today);
  
  return {
    totalEnrichments: log.length,
    todayCount: todayEnrichments.length,
    totalTokensUsed: log.reduce((sum, e) => sum + (e.tokensUsed || 0), 0),
    averagePerSession: log.length > 0 
      ? Math.round(log.reduce((sum, e) => sum + (e.queriesGenerated || 0), 0) / log.length) 
      : 0,
  };
};

export default {
  enrichQuery,
  getEnrichmentEnabled,
  setEnrichmentEnabled,
  getEnrichmentLog,
  getEnrichmentStats,
};