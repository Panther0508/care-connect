// src/services/meshOutbreakDetector.ts
// Privacy-preserving outbreak detection from anonymised search counters

import { getMeshState } from '../lib/gossipProtocol';
import type { MeshDoc } from '../lib/gossipProtocol';

export const OUTBREAK_THRESHOLD = 5; // Minimum unique searches to trigger alert
const ALERT_COOLDOWN_DAYS = 7;
const ALERT_COOLDOWN_MS = ALERT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

const ALERTS_STORAGE_KEY = 'mesh_outbreak_alerts';

interface OutbreakAlert {
  id: string;
  term: string;
  region: string;
  count: number;
  firstDetectedAt: number;
  lastDetectedAt: number;
  notifiedAt: number;
  status: 'active' | 'monitoring' | 'resolved';
}

interface DetectorState {
  alerts: OutbreakAlert[];
  lastEvaluation: number;
}

// Privacy: hash function for search terms (SHA-256 truncated)
async function hashTerm(term: string): Promise<string> {
  const msg = new TextEncoder().encode(term.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', msg);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Region derivation from coarse location (simplified: facility-based)
function deriveRegion(facilityId?: string): string {
  // In production, this would map facilityId to a region (state/LGA)
  // For demo, use a constant region or derive from user location if available
  return 'Your Area'; // Placeholder - replace with actual region logic
}

// Load detector state from IndexedDB
async function loadDetectorState(): Promise<DetectorState> {
  try {
    const stored = await localStorage.getItem(ALERTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load outbreak detector state:', e);
  }
  return { alerts: [], lastEvaluation: 0 };
}

// Save detector state to IndexedDB
async function saveDetectorState(state: DetectorState): Promise<void> {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save outbreak detector state:', e);
  }
}

// Check if alert was recently notified (within cooldown)
function hasRecentAlert(alerts: OutbreakAlert[], term: string, region: string): boolean {
  const cutoff = Date.now() - ALERT_COOLDOWN_MS;
  return alerts.some(
    a => a.term === term && a.region === region && a.notifiedAt > cutoff && a.status !== 'resolved'
  );
}

// Evaluate mesh state for new outbreaks
export async function evaluateOutbreak(meshDoc: MeshDoc): Promise<void> {
  const state = getMeshState(meshDoc);
  const detectorState = await loadDetectorState();
  const now = Date.now();

  // Get current search counters
  const counters = state.searchCounters || {};

  for (const [term, count] of Object.entries(counters)) {
    if (count < OUTBREAK_THRESHOLD) continue;

    const region = deriveRegion(); // Could be enhanced with facility proximity

    // Check if we already have an alert for this term+region
    const existingAlert = detectorState.alerts.find(
      a => a.term === term && a.region === region && a.status !== 'resolved'
    );

    if (!existingAlert && !hasRecentAlert(detectorState.alerts, term, region)) {
      // Create new alert
      const alert: OutbreakAlert = {
        id: crypto.randomUUID(),
        term,
        region,
        count,
        firstDetectedAt: now,
        lastDetectedAt: now,
        notifiedAt: now,
        status: 'active',
      };

      detectorState.alerts.unshift(alert);

      // Dispatch notification via global event for UI to handle
      const event = new CustomEvent('outbreakAlert', { detail: alert });
      window.dispatchEvent(event);

      // Also persist to localStorage for alerts page
      persistAlertToInbox(alert);
    } else if (existingAlert) {
      // Update existing alert's count and lastDetectedAt
      existingAlert.count = Math.max(existingAlert.count, count);
      existingAlert.lastDetectedAt = now;
      if (existingAlert.status === 'monitoring') {
        existingAlert.status = 'active';
      }
    }
  }

  detectorState.lastEvaluation = now;
  await saveDetectorState(detectorState);
}

// Persist alert to user's alert inbox for later viewing
async function persistAlertToInbox(alert: OutbreakAlert): Promise<void> {
  try {
    const key = 'user_outbreak_alerts';
    const existing = await localStorage.getItem(key);
    const alerts = existing ? JSON.parse(existing) : [];
    alerts.unshift({
      ...alert,
      read: false,
      receivedAt: Date.now(),
    });
    // Keep only last 100 alerts
    const trimmed = alerts.slice(0, 100);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to persist alert to inbox:', e);
  }
}

// Get all outbreak alerts for display
export async function getOutbreakAlerts(): Promise<OutbreakAlert[]> {
  try {
    const detectorState = await loadDetectorState();
    return detectorState.alerts;
  } catch (e) {
    console.error('Failed to get outbreak alerts:', e);
    return [];
  }
}

// Get aggregated search counters (for CHW dashboard)
export function getAggregatedCounters(meshDoc: MeshDoc): Record<string, number> {
  const state = getMeshState(meshDoc);
  return state.searchCounters || {};
}

// Mark alert as resolved
export async function resolveAlert(alertId: string): Promise<void> {
  const detectorState = await loadDetectorState();
  const alert = detectorState.alerts.find(a => a.id === alertId);
  if (alert) {
    alert.status = 'resolved';
    await saveDetectorState(detectorState);
  }
}
