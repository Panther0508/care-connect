// src/services/milestoneEngine.js
// Milestone Engine - Achievement tracking
// Uses native IndexedDB

import { openDB } from '../lib/idb';
const DB_NAME = 'VitaCareDB';
const DB_VERSION = 1;
const MILESTONES_STORE = 'userMilestones';

let dbInstance = null;

/**
 * Save a milestone as achieved for the user
 */
export const saveMilestoneAchieved = async (userId, milestoneId, milestoneData) => {
  const db = await openDB();
  const tx = db.transaction(MILESTONES_STORE, 'readwrite');
  const store = tx.objectStore(MILESTONES_STORE);

  const id = `${userId}_${milestoneId}`;
  const dataToSave = {
    id,
    userId,
    milestoneId,
    achievedAt: new Date().toISOString(),
    ...milestoneData,
  };

  await store.put(dataToSave);

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Get all achieved milestones for a user
 */
export const getAchievedMilestones = async (userId) => {
  const db = await openDB();
  const tx = db.transaction(MILESTONES_STORE, 'readonly');
  const store = tx.objectStore(MILESTONES_STORE);
  const request = store.getAll();

  const milestones = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  return milestones.filter(m => m.userId === userId);
};

/**
 * Check if a specific milestone has been achieved
 */
export const isMilestoneAchieved = async (userId, milestoneId) => {
  const db = await openDB();
  const tx = db.transaction(MILESTONES_STORE, 'readonly');
  const store = tx.objectStore(MILESTONES_STORE);
  const id = `${userId}_${milestoneId}`;
  const request = store.get(id);

  const milestone = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  return !!milestone;
};

/**
 * Define milestones and check conditions
 * Returns an array of new milestones that are achieved but not yet recorded.
 */
export const checkAndSaveNewMilestones = async (userId, userState) => {
  // Placeholder: no milestones defined yet
  return [];
};

export default {
  initMilestoneDB: openDB,
  saveMilestoneAchieved,
  getAchievedMilestones,
  isMilestoneAchieved,
  checkAndSaveNewMilestones,
};
