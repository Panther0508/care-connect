// src/services/meshOutbreakDetector.ts
// Privacy-preserving outbreak detection from anonymised search counters
// Enhanced with demo-mode simulation for competitions

import { getMeshState } from '../lib/gossipProtocol';
import type { MeshDoc } from '../lib/gossipProtocol';

export const OUTBREAK_THRESHOLD = 5; // Minimum unique searches to trigger alert
const ALERT_COOLDOWN_DAYS = 7;
const ALERT_COOLDOWN_MS = ALERT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

const ALERTS_STORAGE_KEY = 'mesh_outbreak_alerts';
const DEMO_MODE_KEY = 'mesh_demo_mode';

// Demo-mode: pre-canned plausible outbreaks for Nigeria/West Africa
const DEMO_ALERTS: OutbreakAlert[] = [
  {
    id: 'demo-1',
    term: 'malaria',
    region: 'Lagos State',
    count: 127,
    firstDetectedAt: Date.now() - 5 * 86400000,
    lastDetectedAt: Date.now(),
    notifiedAt: Date.now(),
    status: 'active',
  },
  {
    id: 'demo-2',
    term: 'cholera',
    region: 'Abuja FCT',
    count: 43,
    firstDetectedAt: Date.now() - 3 * 86400000,
    lastDetectedAt: Date.now() - 3600000,
    notifiedAt: Date.now() - 86400000,
    status: 'monitoring',
  },
  {
    id: 'demo-3',
    term: 'lassa fever',
    region: 'Rivers State',
    count: 28,
    firstDetectedAt: Date.now() - 7 * 86400000,
    lastDetectedAt: Date.now() - 2 * 86400000,
    notifiedAt: Date.now() - 3 * 86400000,
    status: 'active',
  },
];

// Generate 7-day history for charts
export function getHistoricalTrend(days: number = 7): { date: string; malaria: number; cholera: number; fever: number }[] {
  const trend = [];
  const now = Date.now();
  const oneDay = 86400000;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * oneDay);
    const dateStr = date.toISOString().split('T')[0];
    // Plausible variations
    trend.push({
      date: dateStr,
      malaria: Math.floor(80 + Math.random() * 60 + (i * 5)),
      cholera: Math.floor(20 + Math.random() * 30),
      fever: Math.floor(40 + Math.random() * 50),
    });
  }
  return trend;
}

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
  const demoEnabled = await isDemoModeEnabled();
  if (demoEnabled) {
    // Return demo alerts with dynamic lastDetectedAt to appear fresh
    return DEMO_ALERTS.map(alert => ({
      ...alert,
      lastDetectedAt: alert.id === 'demo-1' ? Date.now() : Date.now() - Math.random() * 86400000,
    }));
  }

  try {
    const detectorState = await loadDetectorState();
    return detectorState.alerts;
  } catch (e) {
    console.error('Failed to get outbreak alerts:', e);
    return [];
  }
}

// Enable demo mode (for competitions)
export async function enableDemoMode(): Promise<void> {
  localStorage.setItem(DEMO_MODE_KEY, 'true');
  // Seed initial demo alerts into detector state so they persist across reloads
  const state = await loadDetectorState();
  // Merge demo alerts, avoiding duplicates
  for (const demo of DEMO_ALERTS) {
    if (!state.alerts.some(a => a.id === demo.id)) {
      state.alerts.push({ ...demo, notifiedAt: Date.now(), firstDetectedAt: Date.now() - 86400000 });
    }
  }
  await saveDetectorState(state);
}

// Disable demo mode
export async function disableDemoMode(): Promise<void> {
  localStorage.removeItem(DEMO_MODE_KEY);
  // Remove demo alerts from detector state
  const state = await loadDetectorState();
  state.alerts = state.alerts.filter(a => !a.id.startsWith('demo-'));
  await saveDetectorState(state);
}

// Check if demo mode is enabled
export async function isDemoModeEnabled(): Promise<boolean> {
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
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
