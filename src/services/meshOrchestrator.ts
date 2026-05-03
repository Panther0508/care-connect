// src/services/meshOrchestrator.ts
// Central coordinator for Mesh Intelligence

// CRITICAL: Automerge v2 requires use() to be called BEFORE any other Automerge imports or usage.
// This MUST be the FIRST statement in this file (before importing gossipProtocol which uses Automerge at top-level)
import * as automerge from '@automerge/automerge/slim';
try {
  // @ts-ignore
  automerge.use();
} catch (e) {
  if (!e.message?.includes('already')) console.error('Automerge init failed:', e);
}

import {
  MeshDoc,
  createMeshDoc,
  recordSearch as gossipRecordSearch,
  recordConfirmation as gossipRecordConfirmation,
  recordStockout as gossipRecordStockout,
  mergeMeshes,
  serializeMesh,
  deserializeMesh,
  getMeshState as getGossipState,
} from '../lib/gossipProtocol';

import {
  getMeshState as getIDBMeshState,
  storeMeshState as storeIDBMeshState,
  storeSearchLog
} from '../lib/idb';
import { startBluetoothMesh, stopBluetoothMesh, forceBroadcast, setOnUpdate } from './bluetoothTransport';
import { initSatelliteSnitch } from './satelliteSnitch';
import { evaluateOutbreak } from './meshOutbreakDetector';
import { startSimulatedMesh, stopSimulatedMesh } from './simulatedMeshTransport';

let meshDoc: MeshDoc | null = null;
let persistTimeout: number | null = null;

const PERSIST_DELAY_MS = 5000;

/**
 * Initialize mesh orchestrator
 */
export async function initMeshOrchestrator(): Promise<void> {
  // Load persisted mesh state
  const saved = await getIDBMeshState('gossip');
  if (saved) {
    try {
      meshDoc = deserializeMesh(saved);
    } catch (e) {
      meshDoc = createMeshDoc();
    }
  } else {
    meshDoc = createMeshDoc();
  }

   // Register callback for incoming peer data
   setOnUpdate((remoteMesh: MeshDoc) => {
     meshDoc = mergeMeshes(meshDoc, remoteMesh);
     schedulePersist();
     // Evaluate for outbreaks after merge
     evaluateOutbreak(meshDoc);
     // Periodic broadcast will propagate further
   });

   // Start transports
   try {
     // Start simulated mesh (localStorage events) for PWA web use
     startSimulatedMesh();
     // Start Bluetooth mesh (real hardware) for Capacitor APK
     await startBluetoothMesh();
   } catch (err) {
     // Bluetooth unavailable - continue with simulated mesh only
   }

  // Start satellite snitch
  initSatelliteSnitch();

  // Register background sync tags
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(reg => {
        reg.sync.register('mesh-gossip').catch(() => {});
        reg.sync.register('satellite-upload').catch(() => {});
      })
      .catch(() => {});
  }
}

/**
 * Record a search query
 */
export function recordSearch(term: string): void {
  meshDoc = gossipRecordSearch(meshDoc, term);
  storeSearchLog({ term, timestamp: new Date().toISOString() }).catch(console.error);
  schedulePersist();
  scheduleBroadcast();
}

/**
 * Record a facility confirmation
 */
export function recordConfirmation(facilityId: string): void {
  meshDoc = gossipRecordConfirmation(meshDoc, facilityId);
  schedulePersist();
  scheduleBroadcast();
}

/**
 * Record a stockout alert
 */
export function recordStockout(drugName: string, facilityId: string): void {
  meshDoc = gossipRecordStockout(meshDoc, drugName, facilityId);
  schedulePersist();
  scheduleBroadcast();
}

/**
 * Handle incoming peer update (called by bluetoothTransport)
 */
export function handlePeerUpdate(remoteMesh: MeshDoc): void {
  meshDoc = mergeMeshes(meshDoc, remoteMesh);
  schedulePersist();
  // Broadcast handled by periodic interval; don't broadcast immediately to avoid loops
}

/**
 * Merge with remote mesh (for direct merges)
 */
export function mergeWithRemote(local: MeshDoc, remote: MeshDoc): MeshDoc {
  return mergeMeshes(local, remote);
}

/**
 * Get the current mesh document (raw)
 */
export function getCurrentMesh(): MeshDoc {
  return meshDoc;
}

/**
 * Get aggregated mesh data for dashboard display
 */
export function getAggregatedMeshData() {
  return getGossipState(meshDoc);
}

/**
 * Schedule a persisted save (throttled)
 */
function schedulePersist(): void {
  if (persistTimeout) clearTimeout(persistTimeout);
  persistTimeout = window.setTimeout(() => {
    saveToStorage();
  }, PERSIST_DELAY_MS);
}

/**
 * Save current mesh state to IndexedDB
 */
async function saveToStorage(): Promise<void> {
  try {
    const serialized = serializeMesh(meshDoc);
    await storeIDBMeshState('gossip', serialized);
  } catch (error) {
    console.error('Failed to persist mesh state:', error);
  }
}

/**
 * Schedule a broadcast (throttled to immediate)
 */
function scheduleBroadcast(): void {
  forceBroadcast();
}

/**
 * Stop orchestrator (for cleanup)
 */
export function stopMeshOrchestrator(): void {
  stopBluetoothMesh();
  stopSimulatedMesh();
  if (persistTimeout) clearTimeout(persistTimeout);
  saveToStorage();
}

// Singleton export
export const meshOrchestrator = {
  init: initMeshOrchestrator,
  recordSearch,
  recordConfirmation,
  recordStockout,
  handlePeerUpdate,
  mergeWithRemote,
  getCurrentMesh,
  getAggregatedMeshData,
  stop: stopMeshOrchestrator,
};
