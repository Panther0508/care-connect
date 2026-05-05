// Family Profiles Service - Manage dependents and their health graphs
// IndexedDB store: 'dependents' with separate CRDT documents per dependent

import { openDB } from 'idb';
import * as Y from 'yjs';

const DB_NAME = 'vitachain-family';
const DB_VERSION = 1;

let dbPromise = null;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('dependents')) {
          const store = db.createObjectStore('dependents', { keyPath: 'id' });
          store.createIndex('relationship', 'relationship');
          store.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('familyHealthGraphs')) {
          db.createObjectStore('familyHealthGraphs', { keyPath: 'dependentId' });
        }
        if (!db.objectStoreNames.contains('currentProfile')) {
          db.createObjectStore('currentProfile', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
};

// Get all dependents
export const getDependents = async () => {
  const db = await initDB();
  return await db.getAll('dependents');
};

// Add a new dependent
export const addDependent = async (profile) => {
  const db = await initDB();
  const id = crypto.randomUUID();
  const timestamp = Date.now();
  
  const dependent = {
    id,
    ...profile,
    healthGraphId: `healthgraph_${id}`,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  
  await db.put('dependents', dependent);
  
  // Initialize empty health graph for this dependent
  const doc = new Y.Doc();
  const graphArray = doc.getArray('healthGraph');
  graphArray.insert(0, []);
  
  await db.put('familyHealthGraphs', {
    dependentId: id,
    docState: Y.encodeStateAsUpdate(doc),
    updatedAt: timestamp,
  });
  
  return dependent;
};

// Update dependent profile
export const updateDependent = async (id, updates) => {
  const db = await initDB();
  const existing = await db.get('dependents', id);
  if (!existing) throw new Error('Dependent not found');
  
  const updated = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  
  await db.put('dependents', updated);
  return updated;
};

// Delete dependent
export const deleteDependent = async (id) => {
  const db = await initDB();
  await db.delete('dependents', id);
  await db.delete('familyHealthGraphs', id);
};

// Get dependent by ID
export const getDependent = async (id) => {
  const db = await initDB();
  return await db.get('dependents', id);
};

// Get health graph for a dependent
export const getDependentHealthGraph = async (dependentId) => {
  const db = await initDB();
  const record = await db.get('familyHealthGraphs', dependentId);
  
  if (!record) return null;
  
  const doc = new Y.Doc();
  Y.applyUpdate(doc, new Uint8Array(record.docState));
  return doc;
};

// Save health graph for dependent
export const saveDependentHealthGraph = async (dependentId, doc) => {
  const db = await initDB();
  const update = Y.encodeStateAsUpdate(doc);
  
  await db.put('familyHealthGraphs', {
    dependentId,
    docState: Array.from(update),
    updatedAt: Date.now(),
  });
};

// Set current profile (self or dependent)
export const setCurrentProfile = async (profile) => {
  const db = await initDB();
  await db.put('currentProfile', { key: 'active', ...profile });
};

// Get current profile
export const getCurrentProfile = async () => {
  const db = await initDB();
  return await db.get('currentProfile', 'active');
};

// Switch to a profile (self or dependent ID)
export const switchProfile = async (profileIdentifier) => {
  if (profileIdentifier === 'self') {
    return await setCurrentProfile({ id: 'self', isSelf: true });
  }
  
  const dependent = await getDependent(profileIdentifier);
  if (dependent) {
    return await setCurrentProfile({ 
      id: dependent.id, 
      isSelf: false,
      displayName: dependent.displayName,
      relationship: dependent.relationship
    });
  }
  
  throw new Error('Profile not found');
};

// Get profile-scoped health graph ID
export const getProfileHealthGraphId = async (profileId = 'self') => {
  return profileId === 'self' ? 'healthgraph_main' : `healthgraph_${profileId}`;
};

export default {
  getDependents,
  addDependent,
  updateDependent,
  deleteDependent,
  getDependent,
  getDependentHealthGraph,
  saveDependentHealthGraph,
  setCurrentProfile,
  getCurrentProfile,
  switchProfile,
  getProfileHealthGraphId,
};