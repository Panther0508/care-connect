// src/services/simulatedMeshTransport.ts
// Simulated mesh using localStorage events for cross-tab communication
// Used on web PWA when Bluetooth is not available

import type { MeshDoc } from '../lib/gossipProtocol';

const STORAGE_KEY = 'vita_mesh_gossip';
const CLIENT_ID = crypto.randomUUID();

let onUpdateCallback: ((remoteMesh: MeshDoc) => void) | null = null;

/**
 * Set the callback invoked when new mesh data arrives from another tab
 */
export function setOnUpdate(callback: (remoteMesh: MeshDoc) => void): void {
  onUpdateCallback = callback;
}

/**
 * Start the simulated mesh transport
 * Listens for 'storage' events and periodically broadcasts local state
 */
export function startSimulatedMesh(): void {
  // Listen for localStorage changes from other tabs
  window.addEventListener('storage', handleStorageChange);

  // Broadcast local state periodically (every 30s)
  setInterval(() => {
    broadcastLocalState();
  }, 30000);

  // Initial broadcast
  broadcastLocalState();
}

/**
 * Stop the simulated mesh transport
 */
export function stopSimulatedMesh(): void {
  window.removeEventListener('storage', handleStorageChange);
}

/**
 * Handle storage event from another tab
 */
function handleStorageChange(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY) return;
  if (!event.newValue) return;

  try {
    const data = JSON.parse(event.newValue);
    if (data.sender === CLIENT_ID) return; // Ignore own broadcast

    const remoteMesh = JSON.parse(data.mesh) as MeshDoc;
    if (onUpdateCallback) {
      onUpdateCallback(remoteMesh);
    }
  } catch (e) {
    // Invalid data ignored
  }
}

/**
 * Broadcast current mesh state via localStorage
 */
export function broadcastLocalState(): void {
  import('./meshOrchestrator').then(({ getCurrentMesh }) => {
    const localMesh = getCurrentMesh();
    const payload = {
      sender: CLIENT_ID,
      mesh: JSON.stringify(localMesh),
      timestamp: Date.now(),
    };
    // Write to localStorage to trigger storage events in other tabs
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // Immediately remove to keep storage clean while event fires
    setTimeout(() => localStorage.removeItem(STORAGE_KEY), 0);
  }).catch(() => {
    // Ignore import errors
  });
}

/**
 * Force broadcast now (for testing)
 */
export function forceBroadcast(): void {
  broadcastLocalState();
}
