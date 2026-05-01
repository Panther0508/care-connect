// src/services/crisisManager.ts
// Event-based crisis popup state manager

interface CrisisState {
  visible: boolean;
  riskLevel: 'CRITICAL' | 'MODERATE' | 'ELEVATED' | 'LOW';
  matchedPattern?: string;
}

let crisisCallback: ((state: CrisisState) => void) | null = null;

/**
 * Register a callback to handle crisis popup visibility
 */
export function registerCrisisHandler(callback: (state: CrisisState) => void): void {
  crisisCallback = callback;
}

/**
 * Show the crisis popup with detection result
 */
export function showCrisisPopup(detectionResult: { riskLevel: string; matchedPattern?: string }): void {
  if (crisisCallback) {
    crisisCallback({
      visible: true,
      riskLevel: detectionResult.riskLevel as any,
      matchedPattern: detectionResult.matchedPattern
    });
  }
}

/**
 * Dismiss the crisis popup
 */
export function dismissCrisisPopup(): void {
  if (crisisCallback) {
    crisisCallback({
      visible: false,
      riskLevel: 'LOW'
    });
  }
}

/**
 * Get current crisis state (for testing/debugging)
 */
export function getCrisisState(): CrisisState | null {
  return null; // State is held by the component using the callback
}