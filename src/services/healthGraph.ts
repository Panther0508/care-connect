// src/services/healthGraph.ts
// Public API for encrypted health graph operations

import type { HealthDoc } from '../lib/crdtHealthGraph';
import {
  createHealthDoc,
  addCondition,
  addMedication,
  addAllergy,
  addEncounter,
  updateCondition,
  updateMedication,
  deleteCondition,
  deleteMedication,
  deleteAllergy,
  deleteEncounter,
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

// Demo passphrase - in production this will come from a secure unlock screen
const DEMO_PASSPHRASE = 'vita-demo-2026';

// Store the derived key in memory (never persisted unencrypted)
let currentKey: CryptoKey | null = null;
let currentDoc: HealthDoc | null = null;
let currentSalt: Uint8Array | null = null;

/**
 * Initialize the health graph: load from IndexedDB, decrypt, and deserialize.
 * Creates a new empty doc if none exists.
 */
export async function initHealthGraph(): Promise<void> {
  const record = await loadHealthGraph();

  if (record) {
    currentSalt = record.salt;
    currentKey = await deriveKey(DEMO_PASSPHRASE, currentSalt);
    const decrypted = await decrypt(record.iv, record.encryptedBlob, currentKey);
    const bytes = new TextEncoder().encode(decrypted);
    currentDoc = deserializeDoc(new Uint8Array(bytes));
  } else {
    currentDoc = createHealthDoc();
    currentSalt = generateSalt();
    currentKey = await deriveKey(DEMO_PASSPHRASE, currentSalt);
    await persistCurrentDoc();
  }
}

/**
 * Persist the current document to encrypted storage
 */
async function persistCurrentDoc(): Promise<void> {
  if (!currentDoc || !currentKey || !currentSalt) {
    throw new Error('Health graph not initialized');
  }

  // Serialize to Uint8Array
  const serialized = serializeDoc(currentDoc);
  const plaintext = new TextDecoder().decode(serialized);

  // Encrypt
  const { iv, ciphertext } = await encrypt(plaintext, currentKey);

  // Save to IndexedDB
  const record: HealthGraphRecord = {
    key: 'latest',
    encryptedBlob: ciphertext,
    iv,
    lastModified: new Date().toISOString(),
    salt: currentSalt,
  };

  await saveHealthGraph(record);
}

/**
 * Add a new condition
 */
export async function addCondition(
  name: string,
  diagnosedDate: string,
  notes: string
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = addCondition(currentDoc, { name, diagnosedDate, notes });
  await persistCurrentDoc();
}

/**
 * Add a new medication
 */
export async function addMedication(
  name: string,
  dose: string,
  frequency: string,
  startDate: string,
  endDate?: string
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = addMedication(currentDoc, { name, dose, frequency, startDate, endDate });
  await persistCurrentDoc();
}

/**
 * Add a new allergy
 */
export async function addAllergy(
  substance: string,
  reaction: string,
  severity: 'mild' | 'moderate' | 'severe'
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = addAllergy(currentDoc, { substance, reaction, severity });
  await persistCurrentDoc();
}

/**
 * Add a new encounter
 */
export async function addEncounter(
  date: string,
  facilityName: string,
  reason: string,
  notes?: string
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = addEncounter(currentDoc, { date, facilityName, reason, notes });
  await persistCurrentDoc();
}

/**
 * Update a condition
 */
export async function updateCondition(
  id: string,
  updates: Partial<{ name: string; diagnosedDate: string; notes: string }>
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = updateCondition(currentDoc, id, updates);
  await persistCurrentDoc();
}

/**
 * Update a medication
 */
export async function updateMedication(
  id: string,
  updates: Partial<{ name: string; dose: string; frequency: string; startDate: string; endDate: string }>
): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = updateMedication(currentDoc, id, updates);
  await persistCurrentDoc();
}

/**
 * Delete a condition
 */
export async function removeCondition(id: string): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = deleteCondition(currentDoc, id);
  await persistCurrentDoc();
}

/**
 * Delete a medication
 */
export async function removeMedication(id: string): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = deleteMedication(currentDoc, id);
  await persistCurrentDoc();
}

/**
 * Delete an allergy
 */
export async function removeAllergy(id: string): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = deleteAllergy(currentDoc, id);
  await persistCurrentDoc();
}

/**
 * Delete an encounter
 */
export async function removeEncounter(id: string): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  currentDoc = deleteEncounter(currentDoc, id);
  await persistCurrentDoc();
}

/**
 * Get the current health state as a plain object
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
 * Merge with a remote health document (for future sync features)
 */
export async function mergeWithRemote(remoteSerialized: Uint8Array): Promise<void> {
  if (!currentDoc) await initHealthGraph();
  const remoteDoc = deserializeDoc(remoteSerialized);
  currentDoc = mergeDocs(currentDoc, remoteDoc);
  await persistCurrentDoc();
}

/**
 * Export the current health document as an encrypted blob (for backup/sharing)
 */
export async function exportEncryptedBlob(): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer; salt: Uint8Array }> {
  if (!currentDoc || !currentKey) await initHealthGraph();
  const serialized = serializeDoc(currentDoc);
  const plaintext = new TextDecoder().decode(serialized);
  const { iv, ciphertext } = await encrypt(plaintext, currentKey!);
  return { iv, ciphertext, salt: currentSalt! };
}

/**
 * Import an encrypted health blob (replaces current data)
 */
export async function importEncryptedBlob(
  iv: Uint8Array,
  ciphertext: ArrayBuffer,
  salt: Uint8Array
): Promise<void> {
  const key = await deriveKey(DEMO_PASSPHRASE, salt);
  const decrypted = await decrypt(iv, ciphertext, key);
  const bytes = new TextEncoder().encode(decrypted);
  currentDoc = deserializeDoc(new Uint8Array(bytes));
  currentKey = key;
  currentSalt = salt;
  await persistCurrentDoc();
}
