// src/services/bluetoothTransport.ts
// Hybrid transport: BroadcastChannel (local dev) + Web Bluetooth (cross-device)

import type { MeshDoc } from '../lib/gossipProtocol';

// BroadcastChannel for same-device tab communication
const channel = new BroadcastChannel('vitachain-mesh');

// Unique ID for this client (tab)
const CLIENT_ID = crypto.randomUUID();

// Web Bluetooth constants
const SERVICE_UUID = '0000feed-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000beef-0000-1000-8000-00805f9b34fb';

let bluetoothEnabled = false;
let broadcastInterval: number | null = null;
let onUpdateCallback: ((remoteMesh: MeshDoc) => void) | null = null;

/**
 * Set the callback invoked when new mesh data arrives
 */
export function setOnUpdate(callback: (remoteMesh: MeshDoc) => void): void {
  onUpdateCallback = callback;
}

/**
 * Start the mesh transport
 */
export async function startBluetoothMesh(): Promise<void> {
  channel.onmessage = (event) => {
    const msg = event.data;
    if (msg.sender === CLIENT_ID) return;

    // Handle full mesh sync messages
    if (msg.mesh && onUpdateCallback) {
      onUpdateCallback(msg.mesh);
    }

    // Handle lightweight search events
    if (msg.type === 'search' && msg.termHash) {
      import('./meshOrchestrator').then(({ recordSearch }) => {
        recordSearch(msg.termHash);
      }).catch(() => {});
    }
  };

  try {
    await startWebBluetooth();
  } catch {
    // Bluetooth not available - continue with local channel only
  }

  startPeriodicBroadcast();
}

/**
 * Stop the mesh transport
 */
export function stopBluetoothMesh(): void {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
  channel.close();
  stopWebBluetooth();
}

/**
 * Start periodic gossip broadcast
 */
function startPeriodicBroadcast(): void {
  if (broadcastInterval) clearInterval(broadcastInterval!);
  broadcastInterval = window.setInterval(() => {
    broadcastLocalState();
  }, 30000);
}

/**
 * Broadcast current mesh state via all available transports
 */
function broadcastLocalState(): void {
  import('./meshOrchestrator').then(({ getCurrentMesh }) => {
    const localMesh = getCurrentMesh();
    channel.postMessage({ sender: CLIENT_ID, mesh: localMesh });
    if (bluetoothEnabled) {
      sendViaBluetooth(localMesh);
    }
  }).catch(() => {
    // Ignore import errors during broadcast
  });
}

/**
 * Web Bluetooth: initialize scanning (client-mode only)
 */
async function startWebBluetooth(): Promise<void> {
  if (!('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth not supported');
  }
  // Peripheral mode not widely available; skip actual BLE setup
  bluetoothEnabled = false;
}

/**
 * Send mesh state via Bluetooth characteristic write
 */
async function sendViaBluetooth(mesh: MeshDoc): Promise<void> {
  // Not implemented – peripheral mode not widely available
}

/**
 * Stop Web Bluetooth
 */
function stopWebBluetooth(): void {
  bluetoothEnabled = false;
}

/**
 * Handle incoming Bluetooth data (called from characteristic notifications)
 */
export function handleIncomingBluetoothData(data: string): void {
  try {
    const remoteMesh: MeshDoc = JSON.parse(data);
    if (onUpdateCallback) onUpdateCallback(remoteMesh);
  } catch {
    // Invalid data ignored
  }
}

/**
 * Force broadcast now (for testing)
 */
export function forceBroadcast(): void {
  broadcastLocalState();
}

/**
 * Get transport status
 */
export function getTransportStatus(): { bluetooth: boolean; local: boolean } {
  return {
    bluetooth: bluetoothEnabled,
    local: true,
  };
}
