// src/services/crisisDetector.ts
// Crisis detection system - THREE TIER ARCHITECTURE
// Monitors all user input and AI output for self-harm/suicide indicators

// CRITICAL PATTERNS - Immediate popup trigger
const CRITICAL_PATTERNS = [
  'kill myself',
  'end my life',
  'suicide',
  'want to die',
  'better off dead',
  'not worth living',
  'end it all',
  'take my own life',
  'commit suicide',
  'no reason to live',
  'everyone better off without me',
  'go to sleep and never wake',
  'hurt myself',
  'cut myself',
  'self harm',
  'self-harm',
  'burn myself',
  'harm myself',
  'injure myself',
  "can't go on",
  "can't take it anymore",
  'no way out',
  'hopeless',
  'nothing left',
  'given up',
  'want to disappear',
  'just want it to stop',
  'wrote a note',
  'goodbye letter',
  'say goodbye',
  'final goodbye',
  'made a plan',
  'have a plan',
  'figured out how',
  'chosen a method',
  'overdose',
  'hang myself',
  'jump off',
  'jump from'
];

// MODERATE RISK PATTERNS - Popup if 2+ matched
const MODERATE_PATTERNS = [
  'depressed',
  'lonely',
  'worthless',
  'nobody cares',
  'alone',
  'sad all the time',
  'crying every day',
  "can't sleep",
  'no appetite',
  'anxiety attack',
  'panic attack',
  'breaking down',
  'falling apart',
  "don't see the point",
  "what's the point",
  'tired of living'
];

export interface CrisisDetectionResult {
  riskLevel: 'CRITICAL' | 'MODERATE' | 'ELEVATED' | 'LOW';
  requiresImmediatePopup: boolean;
  matchedPatterns?: string[];
}

/**
 * Scan a message for crisis indicators
 */
export function scanMessage(text: string): CrisisDetectionResult {
  if (!text || typeof text !== 'string') {
    return { riskLevel: 'LOW', requiresImmediatePopup: false };
  }

  const lowerText = text.toLowerCase();

  // Layer 1: Check for critical patterns
  const criticalMatches: string[] = [];
  for (const pattern of CRITICAL_PATTERNS) {
    if (lowerText.includes(pattern)) {
      criticalMatches.push(pattern);
    }
  }

  if (criticalMatches.length > 0) {
    return {
      riskLevel: 'CRITICAL',
      requiresImmediatePopup: true,
      matchedPatterns: criticalMatches
    };
  }

  // Layer 2: Check for moderate patterns
  const moderateMatches: string[] = [];
  for (const pattern of MODERATE_PATTERNS) {
    if (lowerText.includes(pattern)) {
      moderateMatches.push(pattern);
    }
  }

  if (moderateMatches.length >= 2) {
    return {
      riskLevel: 'MODERATE',
      requiresImmediatePopup: true,
      matchedPatterns: moderateMatches
    };
  }

  if (moderateMatches.length === 1) {
    return {
      riskLevel: 'ELEVATED',
      requiresImmediatePopup: false,
      matchedPatterns: moderateMatches
    };
  }

  return {
    riskLevel: 'LOW',
    requiresImmediatePopup: false
  };
}

/**
 * Scan an AI response - checks for CRISIS_TRIGGER_TOKEN and crisis patterns
 */
export function scanAIResponse(text: string): CrisisDetectionResult {
  if (!text || typeof text !== 'string') {
    return { riskLevel: 'LOW', requiresImmediatePopup: false };
  }

  // Check for explicit crisis token in AI response
  if (text.includes('<<VITACHAIN_CRISIS_DETECTED>>')) {
    return {
      riskLevel: 'CRITICAL',
      requiresImmediatePopup: true,
      matchedPatterns: ['CRISIS_TRIGGER_TOKEN']
    };
  }

  // Also scan the text for crisis patterns (defensive)
  return scanMessage(text);
}

/**
 * Get country-specific emergency and crisis hotline numbers
 */
export function getEmergencyNumbers(countryCode?: string): {
  emergency: string;
  crisisHotline?: string;
  localName?: string;
} {
  const normalizedCode = (countryCode || '').toLowerCase();

  const countryData: Record<string, { emergency: string; crisisHotline: string; localName: string }> = {
    ng: { emergency: '112', crisisHotline: '+234 806 210 6493', localName: 'LUTH Suicide Hotline' },
    ke: { emergency: '999', crisisHotline: '+254 20 3000378', localName: 'Befrienders Kenya' },
    gh: { emergency: '112', crisisHotline: '+233 244 846 721', localName: 'Ghana Crisis Hotline' },
    za: { emergency: '10111', crisisHotline: '0800 567 567', localName: 'South African Depression Hotline' },
    tz: { emergency: '112', crisisHotline: '+255 22 2115158', localName: 'Tanzania Mental Health' },
    ug: { emergency: '112', crisisHotline: '0800 211 211', localName: 'Uganda Free Helpline' },
    rw: { emergency: '112', crisisHotline: '+250 788 383 405', localName: 'Rwanda Crisis Support' },
    in: { emergency: '112', crisisHotline: '+91 98204 66726', localName: 'iCall India Helpline' },
  };

  const result = countryData[normalizedCode];
  if (result) {
    return result;
  }

  // Default / fallback
  return {
    emergency: '112',
    crisisHotline: undefined,
    localName: undefined
  };
}