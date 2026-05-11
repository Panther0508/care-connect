// src/services/satelliteSnitch.ts
// Simulated satellite upload trigger (cloud-optional component)

import { meshOrchestrator } from "./meshOrchestrator";

const SYNC_KEY = 'lastSatelliteSync';
const DEFAULT_INTERVAL_HOURS = 168; // 7 days

let enabled = true;
let checkInterval: number | null = null;

/**
 * Initialize satellite snitch – starts online listener
 */
export function initSatelliteSnitch(): void {
  if (!enabled) return;

  window.addEventListener('online', checkAndUpload);
  
  checkInterval = window.setInterval(() => {
    if (navigator.onLine) {
      checkAndUpload();
    }
  }, 60 * 60 * 1000);
}

/**
 * Stop satellite snitch
 */
export function stopSatelliteSnitch(): void {
  if (checkInterval) clearInterval(checkInterval);
  window.removeEventListener('online', checkAndUpload);
}

/**
 * Check if upload is due and trigger
 */
async function checkAndUpload(): Promise<void> {
  const lastSync = localStorage.getItem(SYNC_KEY);
  const now = Date.now();
  const intervalMs = (getIntervalHours() * 60 * 60 * 1000);

  if (!lastSync || (now - parseInt(lastSync)) > intervalMs) {
    await triggerUpload();
  }
}

/**
 * Get sync interval from env or default
 */
function getIntervalHours(): number {
  const env = import.meta.env;
  const custom = env.VITE_SATELLITE_INTERVAL_HOURS;
  return custom ? parseInt(custom) : DEFAULT_INTERVAL_HOURS;
}

/**
 * Trigger a simulated satellite upload
 */
async function triggerUpload(): Promise<void> {
  try {
    const payload = meshOrchestrator.getAggregatedMeshData();

    // Simulated upload - in production would POST to Vercel function
    // For tests, we need to actually POST to mock endpoint
      try {
        const token = import.meta.env.VITE_SATELLITE_AUTH_TOKEN;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        await fetch('/api/satellite-ingest', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      } catch (e) {
        // ignore network errors during dev
      }

    localStorage.setItem(SYNC_KEY, Date.now().toString());
  } catch (error) {
    console.error('Satellite upload failed:', error);
  }
}

/**
 * Force an immediate upload (for debug/demo panel)
 */
export async function forceUpload(): Promise<void> {
  await triggerUpload();
}

// Expose globally for tests
if (typeof window !== 'undefined') {
  (window as any).satelliteSnitch = { forceUpload };
}
