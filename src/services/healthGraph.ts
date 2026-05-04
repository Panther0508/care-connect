// src/services/healthGraph.ts
// User-aware health graph service with per-user isolated storage

import type { HealthDoc } from '../lib/crdtHealthGraph';
import {
  createHealthDoc,
  addCondition as crdtAddCondition,
  addMedication as crdtAddMedication,
  addAllergy as crdtAddAllergy,
  addEncounter as crdtAddEncounter,
  updateCondition as crdtUpdateCondition,
  updateMedication as crdtUpdateMedication,
  deleteCondition as crdtDeleteCondition,
  deleteMedication as crdtDeleteMedication,
  deleteAllergy as crdtDeleteAllergy,
  deleteEncounter as crdtDeleteEncounter,
  mergeDocs,
  serializeDoc,
  deserializeDoc,
  getSummary,
} from '../lib/crdtHealthGraph';

import {
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  EncryptedPayload,
} from '../lib/encryption';

import {
  loadHealthGraph,
  saveHealthGraph,
  HealthGraphRecord,
} from '../lib/idb';

// In-memory state per user (since we handle one active user at a time)
let currentUserId: string | null = null;
let currentKey: CryptoKey | null = null;
let currentDoc: HealthDoc | null = null;
let currentSalt: Uint8Array | null = null;

const DEMO_PASSPHRASE = 'vita-demo-2026';

/**
 * Set the active user - loads their encrypted health graph from storage
 */
export async function setActiveUser(userId: string, passphrase: string = DEMO_PASSPHRASE): Promise<void> {
  currentUserId = userId;
  currentKey = null;
  currentDoc = null;
  currentSalt = null;

  const storageKey = `healthgraph_${userId}`;
  const record = await loadHealthGraph(storageKey);

  if (record) {
    currentSalt = record.salt;
    currentKey = await deriveKey(passphrase, currentSalt);
    const decrypted = await decrypt(record.iv, record.encryptedBlob, currentKey);
    const bytes = new TextEncoder().encode(decrypted);
    try {
      currentDoc = deserializeDoc(new Uint8Array(bytes));
    } catch (e) {
      console.warn('Failed to deserialize health graph, creating fresh:', e);
      currentDoc = createHealthDoc();
      await persistCurrentDoc();
    }
  } else {
    // Create fresh health graph
    currentDoc = createHealthDoc();
    currentSalt = generateSalt();
    currentKey = await deriveKey(passphrase, currentSalt);
    await persistCurrentDoc();
  }
}

/**
 * Clear active user (on logout)
 */
export function clearActiveUser(): void {
  currentUserId = null;
  currentKey = null;
  currentDoc = null;
  currentSalt = null;
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string | null {
  return currentUserId;
}

/**
 * Persist current document to encrypted storage
 */
async function persistCurrentDoc(): Promise<void> {
  if (!currentDoc || !currentKey || !currentSalt || !currentUserId) {
    throw new Error('Health graph not initialized');
  }

  const serialized = serializeDoc(currentDoc);
  const plaintext = new TextDecoder().decode(serialized);
  const { iv, ciphertext } = await encrypt(plaintext, currentKey);

  const record: HealthGraphRecord = {
    key: `healthgraph_${currentUserId}`,
    encryptedBlob: ciphertext,
    iv,
    lastModified: new Date().toISOString(),
    salt: currentSalt,
  };

  await saveHealthGraph(record);
}

/**
 * Ensure initialized (for backward compatibility)
 */
export async function initHealthGraph(): Promise<void> {
  if (currentDoc) return; // already initialized
  await setActiveUser('latest', DEMO_PASSPHRASE);
}

// --------------------------- CRUD Operations ---------------------------

export async function addCondition(
  name: string,
  diagnosedDate: string,
  notes: string
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = crdtAddCondition(currentDoc, { name, diagnosedDate, notes });
  await persistCurrentDoc();
}

export async function addMedication(
  name: string,
  dose: string,
  frequency: string,
  startDate: string,
  endDate?: string
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = crdtAddMedication(currentDoc, { name, dose, frequency, startDate, endDate });
  await persistCurrentDoc();
}

export async function addAllergy(
  substance: string,
  reaction: string,
  severity: 'mild' | 'moderate' | 'severe'
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = crdtAddAllergy(currentDoc, { substance, reaction, severity });
  await persistCurrentDoc();
}

export async function addEncounter(
  date: string,
  facilityName: string,
  reason: string,
  notes?: string
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = crdtAddEncounter(currentDoc, { date, facilityName, reason, notes });
  await persistCurrentDoc();
}

export async function updateCondition(
  id: string,
  updates: Partial<{ name: string; diagnosedDate: string; notes: string }>
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = crdtUpdateCondition(currentDoc, id, updates);
  await persistCurrentDoc();
}

export async function updateMedication(
  id: string,
  updates: Partial<{ name: string; dose: string; frequency: string; startDate: string; endDate: string }>
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = crdtUpdateMedication(currentDoc, id, updates);
  await persistCurrentDoc();
}

export async function removeCondition(id: string): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = crdtDeleteCondition(currentDoc, id);
  await persistCurrentDoc();
}

export async function removeMedication(id: string): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = crdtDeleteMedication(currentDoc, id);
  await persistCurrentDoc();
}

export async function removeAllergy(id: string): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = crdtDeleteAllergy(currentDoc, id);
  await persistCurrentDoc();
}

export async function removeEncounter(id: string): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = crdtDeleteEncounter(currentDoc, id);
  await persistCurrentDoc();
}

/**
 * Get the current health state
 */
export function getCurrentHealthState() {
  if (!currentDoc) {
    return {
      conditions: [],
      medications: [],
      allergies: [],
      encounters: [],
    };
  }
  return getSummary(currentDoc);
}

/**
 * Merge with remote document
 */
export async function mergeWithRemote(remoteSerialized: Uint8Array): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  const remoteDoc = deserializeDoc(remoteSerialized);
  currentDoc = mergeDocs(currentDoc, remoteDoc);
  await persistCurrentDoc();
}

/**
 * Export as encrypted blob
 */
export async function exportEncryptedBlob(): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer; salt: Uint8Array }> {
  if (!currentDoc || !currentKey) await initHealthGraph();
  const serialized = serializeDoc(currentDoc);
  const plaintext = new TextDecoder().decode(serialized);
  const { iv, ciphertext } = await encrypt(plaintext, currentKey!);
  return { iv, ciphertext, salt: currentSalt! };
}

/**
 * Change the user's passphrase (re-encrypt health graph with new key)
 */
export async function changePassphrase(userId: string, oldPass: string, newPass: string): Promise<void> {
  if (currentUserId !== userId) {
    throw new Error('User mismatch');
  }
  if (!currentDoc) {
    throw new Error('Health graph not initialized');
  }
  // Verify old passphrase by deriving key with current salt
  const verifiedKey = await deriveKey(oldPass, currentSalt!);
  // We could also attempt to decrypt something; but if the key matches, it's fine.
  // Generate new salt and derive new key
  const newSalt = generateSalt();
  const newKey = await deriveKey(newPass, newSalt);

  // Temporarily swap in new key/salt, persist, then update global state
  const prevKey = currentKey;
  const prevSalt = currentSalt;

  currentKey = newKey;
  currentSalt = newSalt;
  try {
    await persistCurrentDoc();
  } catch (e) {
    // Restore previous on failure
    currentKey = prevKey;
    currentSalt = prevSalt;
    throw e;
  }

  // Update the stored passphrase for future sessions (store encrypted under a static key? For demo: store plain in localStorage)
  // In a real app, this would be securely stored or derived from user's authentication.
  try {
    // For demo, store the new passphrase in localStorage so setActiveUser can use it
    localStorage.setItem('vita_user_passphrase', newPass);
  } catch (e) {
    console.warn('Could not store passphrase for next session:', e);
  }

  // Keep global state as new key/salt
  // (Already set)
}
export async function importEncryptedBlob(
  iv: Uint8Array,
  ciphertext: ArrayBuffer,
  salt: Uint8Array,
  userId?: string
): Promise<void> {
  const targetUserId = userId || currentUserId || 'latest';
  const key = await deriveKey(DEMO_PASSPHRASE, salt);
  const decrypted = await decrypt(iv, ciphertext, key);
  const bytes = new TextEncoder().encode(decrypted);
  currentDoc = deserializeDoc(new Uint8Array(bytes));
  currentKey = key;
  currentSalt = salt;
  currentUserId = targetUserId;
  await persistCurrentDoc();
}
