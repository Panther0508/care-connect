// src/services/adaptiveReminders.js
// Adaptive Reminders Engine - Smart notification scheduling
// Uses native IndexedDB

import { openDB } from '../lib/idb';
const DB_NAME = 'vitachain-adaptive-reminders';
const DB_VERSION = 1;
const SETTINGS_STORE = 'reminderSettings';
const HISTORY_STORE = 'reminderHistory';

let dbInstance = null;

// Reminder types
export const REMINDER_TYPES = [
  { id: 'medication', label: 'Medication' },
  { id: 'workout', label: 'Workout' },
  { id: 'meal', label: 'Meal Logging' },
  { id: 'sleep', label: 'Sleep Logging' },
  { id: 'water', label: 'Water Intake' },
  { id: 'appointment', label: 'Appointment Prep' },
  { id: 'passport', label: 'Passport Share Reminder' },
  { id: 'assessment', label: 'Assessment Reminder (PHQ-9/GAD-7)' },
  { id: 'caregap', label: 'Care Gap Alert' }
];

/**
 * Get optimal reminder time for a user and type
 */
export const getOptimalReminderTime = async (userId, type) => {
  const db = await openDB();
  const tx = db.transaction(SETTINGS_STORE, 'readonly');
  const store = tx.objectStore(SETTINGS_STORE);
  const id = [userId, type];
  const request = store.get(id);

  const settings = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  if (!settings) return '09:00';
  return settings.optimalTime || '09:00';
};

/**
 * Schedule an adaptive reminder
 */
export const scheduleAdaptiveReminder = async (userId, type, baseTime) => {
  const db = await openDB();
  const tx = db.transaction(SETTINGS_STORE, 'readwrite');
  const store = tx.objectStore(SETTINGS_STORE);
  const id = [userId, type];
  const getRequest = store.get(id);

  let settings = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  if (!settings) {
    settings = {
      userId,
      type,
      optimalTime: baseTime,
      frequency: 'daily',
      adherenceRate: 0.5,
      lastReminder: null,
      lastResponse: null
    };
  } else {
    settings.optimalTime = baseTime;
    settings.lastReminder = new Date().toISOString();
  }

  const putRequest = store.put(settings);
  await new Promise((resolve, reject) => {
    putRequest.onsuccess = () => resolve();
    putRequest.onerror = () => reject(putRequest.error);
  });

  // Add to history
  const historyTx = db.transaction(HISTORY_STORE, 'readwrite');
  const historyStore = historyTx.objectStore(HISTORY_STORE);
  await historyStore.add({
    userId,
    type,
    timestamp: new Date().toISOString(),
    action: 'scheduled',
    baseTime,
    optimalTime: settings.optimalTime
  });

  await new Promise((resolve) => {
    historyTx.oncomplete = () => resolve();
  });

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return { success: true };
};

/**
 * Adjust reminder frequency based on adherence
 */
export const adjustReminderFrequency = async (userId, type) => {
  const db = await openDB();
  const settingsTx = db.transaction(SETTINGS_STORE, 'readonly');
  const settingsStore = settingsTx.objectStore(SETTINGS_STORE);
  const id = [userId, type];
  const getRequest = settingsStore.get(id);

  const settings = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    settingsTx.oncomplete = () => resolve();
  });

  if (!settings) return null;

  // Get recent history
  const historyTx = db.transaction(HISTORY_STORE, 'readonly');
  const historyStore = historyTx.objectStore(HISTORY_STORE);
  const historyIndex = historyStore.index('userId');
  const historyRequest = historyIndex.getAll(userId);

  const history = await new Promise((resolve) => {
    historyRequest.onsuccess = () => resolve(historyRequest.result || []);
    historyRequest.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    historyTx.oncomplete = () => resolve();
  });

  const typeHistory = history
    .filter(h => h.type === type)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  if (typeHistory.length === 0) {
    return settings.frequency;
  }

  const takenCount = typeHistory.filter(h => h.response === 'taken').length;
  const adherenceRate = takenCount / typeHistory.length;

  settings.adherenceRate = adherenceRate;

  let newFrequency = settings.frequency;
  if (adherenceRate >= 0.8) {
    newFrequency = settings.frequency;
  } else if (adherenceRate < 0.3) {
    newFrequency = 'twice-daily';
  }

  if (newFrequency !== settings.frequency) {
    settings.frequency = newFrequency;
    const updateTx = db.transaction(SETTINGS_STORE, 'readwrite');
    const updateStore = updateTx.objectStore(SETTINGS_STORE);
    await updateStore.put(settings);
    await new Promise((resolve) => {
      updateTx.oncomplete = () => resolve();
    });
  }

  return newFrequency;
};

// Generate contextual message based on user context and adherence
export const generateContextualMessage = async (userId, type) => {
  const db = await openDB();
  const settingsTx = db.transaction(SETTINGS_STORE, 'readonly');
  const settingsStore = settingsTx.objectStore(SETTINGS_STORE);
  const id = [userId, type];
  const settingsRequest = settingsStore.get(id);

  const settings = await new Promise((resolve) => {
    settingsRequest.onsuccess = () => resolve(settingsRequest.result);
    settingsRequest.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    settingsTx.oncomplete = () => resolve();
  });

  const defaultMessages = {
    medication: 'Time to take your medication.',
    workout: 'Time for your workout.',
    meal: 'Time to log your meal.',
    sleep: 'Time to prepare for sleep.',
    water: 'Time to drink water.',
    appointment: 'You have an appointment soon.',
    passport: 'Remember to share your passport with your healthcare provider.',
    assessment: 'Time to complete your health assessment.',
    caregap: 'You have a care gap that needs attention.'
  };

  if (!settings) {
    return defaultMessages[type] || 'Reminder';
  }

  // Get recent history
  const historyTx = db.transaction(HISTORY_STORE, 'readonly');
  const historyStore = historyTx.objectStore(HISTORY_STORE);
  const historyIndex = historyStore.index('userId');
  const historyRequest = historyIndex.getAll(userId);

  const history = await new Promise((resolve) => {
    historyRequest.onsuccess = () => resolve(historyRequest.result || []);
    historyRequest.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    historyTx.oncomplete = () => resolve();
  });

  const typeHistory = history
    .filter(h => h.type === type)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  let recentAdherence = 0.5;
  if (typeHistory.length > 0) {
    const recentTaken = typeHistory.filter(h => h.response === 'taken').length;
    recentAdherence = recentTaken / typeHistory.length;
  }

  const baseMessages = defaultMessages;
  let message = baseMessages[type] || 'Reminder';

  if (recentAdherence >= 0.8) {
    const positivePrefixes = [
      'Great job keeping up with your ',
      'You\'re doing excellent with your ',
      'Keep it up! Your '
    ];
    const prefix = positivePrefixes[Math.floor(Math.random() * positivePrefixes.length)];
    message = prefix + message.toLowerCase().replace('time to ', '').replace('time for ', '');
  } else if (recentAdherence < 0.3) {
    const gentlePrefixes = [
      'Just a friendly reminder to ',
      'We noticed you might have missed this - let\'s try again: ',
      'Haven\'t seen you do this in a bit - '
    ];
    const prefix = gentlePrefixes[Math.floor(Math.random() * gentlePrefixes.length)];
    message = prefix + message.toLowerCase().replace('time to ', '').replace('time for ', '');
  } else {
    const neutralPrefixes = [
      'Reminder to ',
      'Time to ',
      'Don\'t forget to '
    ];
    const prefix = neutralPrefixes[Math.floor(Math.random() * neutralPrefixes.length)];
    message = prefix + message.toLowerCase().replace('time to ', '').replace('time for ', '');
  }

  return message;
};

/**
 * Get reminder history for a user and type
 */
export const getReminderHistory = async (userId, type, limit = 10) => {
  const db = await openDB();
  const tx = db.transaction(HISTORY_STORE, 'readonly');
  const store = tx.objectStore(HISTORY_STORE);
  const index = store.index('userId');
  const request = index.getAll(userId);

  const history = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  return history
    .filter(h => h.type === type)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

/**
 * Mark a reminder as responded to
 */
export const markReminderResponse = async (userId, type, response) => {
  const db = await openDB();
  const settingsTx = db.transaction(SETTINGS_STORE, 'readwrite');
  const settingsStore = settingsTx.objectStore(SETTINGS_STORE);
  const id = [userId, type];
  const getRequest = settingsStore.get(id);

  const settings = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  if (!settings) {
    await new Promise((resolve) => {
      settingsTx.oncomplete = () => resolve();
    });
    return false;
  }

  settings.lastResponse = response;

  await settingsStore.put(settings);

  const historyTx = db.transaction(HISTORY_STORE, 'readwrite');
  const historyStore = historyTx.objectStore(HISTORY_STORE);
  await historyStore.add({
    userId,
    type,
    timestamp: new Date().toISOString(),
    action: 'response',
    response
  });

  await new Promise((resolve) => {
    historyTx.oncomplete = () => resolve();
  });

  await new Promise((resolve, reject) => {
    settingsTx.oncomplete = () => resolve();
    settingsTx.onerror = () => reject(settingsTx.error);
  });

  return true;
};

export default {
  initAdaptiveRemindersDB: openDB,
  REMINDER_TYPES,
  getOptimalReminderTime,
  scheduleAdaptiveReminder,
  adjustReminderFrequency,
  generateContextualMessage,
  getReminderHistory,
  markReminderResponse
};
