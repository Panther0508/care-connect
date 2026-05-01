// src/services/emotionalThreading.js
// Affective Flow - Thread conversation emotional history
// Based on AFlow (Affective Flow Language Model for Emotional Support Conversation)

const DB_NAME = 'vitachain-emotional';
const DB_VERSION = 1;
const STORE = 'threads';

let dbInstance = null;

const openDB = async () => {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'userId' });
      }
    };
    req.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    req.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Get emotional thread context for a user
 * @returns {Array} Last 10 turns with emotional state
 */
export async function getThreadContext(userId) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const req = store.get(userId);

  const result = await new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve({ userId, turns: [] });
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  return (result?.turns || []).slice(-10); // Last 10 turns
}

/**
 * Add a conversation turn with emotional state
 */
export async function addTurn(userId, userMessage, aiResponse, emotionalState) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const req = store.get(userId);

  const record = await new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  const turn = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    userMessage: userMessage.substring(0, 500), // truncate long messages
    aiResponse: (aiResponse || '').substring(0, 1000),
    emotionalState
  };

  if (!record) {
    const newRecord = { userId, turns: [turn] };
    await store.add(newRecord);
  } else {
    record.turns = (record.turns || []).concat(turn);
    // Keep only last 20 turns
    record.turns = record.turns.slice(-20);
    await store.put(record);
  }

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
}

/**
 * Check if user's emotional state improved over conversation
 * Returns: 'improved' | 'declined' | 'stable'
 */
export async function getEmotionalTrend(userId) {
  const turns = await getThreadContext(userId);
  if (turns.length < 3) return 'insufficient-data';

  const emotions = turns.map(t => t.emotionalState);
  const recent = emotions.slice(-3);
  const earlier = emotions.slice(0, -3);

  const emotionalWeight = {
    crisis: -4,
    distressed: -3,
    sad: -2,
    anxious: -1,
    frustrated: -1,
    neutral: 0,
    curious: 1,
    grateful: 2,
    happy: 3
  };

  const recentAvg = recent.map(e => emotionalWeight[e] || 0).reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.map(e => emotionalWeight[e] || 0).reduce((a, b) => a + b, 0) / earlier.length;

  if (recentAvg > earlierAvg + 0.5) return 'improved';
  if (recentAvg < earlierAvg - 0.5) return 'declined';
  return 'stable';
}

/**
 * Build emotional history prompt to inject into system prompt
 */
export function buildEmotionalHistoryPrompt(turns) {
  if (!turns || turns.length === 0) return '';

  const lines = ['CONVERSATION EMOTIONAL HISTORY:'];
  turns.forEach((turn, idx) => {
    const emoji = {
      crisis: '🔴', distressed: '🟠', sad: '😢', anxious: '😰',
      frustrated: '😤', neutral: '⚪', curious: '🤔', grateful: '💙', happy: '😊'
    }[turn.emotionalState] || '⚪';

    const userPreview = turn.userMessage.length > 100
      ? turn.userMessage.substring(0, 100) + '...'
      : turn.userMessage;

    lines.push(`${idx + 1}. ${emoji} User was ${turn.emotionalState}: "${userPreview}"`);
  });

  return lines.join('\n');
}

/**
 * Get emotional trend summary for AI acknowledgment
 */
export function getEmotionalTrendSummary(trend) {
  const summaries = {
    'improved': 'The user appears to be feeling better compared to earlier in our conversation. Note this positive progress.',
    'declined': 'The user\'s emotional state has declined during this conversation. They may need extra support.',
    'stable': 'The user\'s emotional state has remained steady throughout our conversation.',
    'insufficient-data': 'Not enough emotional history to determine trend.'
  };
  return summaries[trend];
}

export default {
  getThreadContext,
  addTurn,
  getEmotionalTrend,
  buildEmotionalHistoryPrompt,
  getEmotionalTrendSummary
};
