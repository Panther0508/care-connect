// src/services/emotionDetector.js
// Emotional State Detection - Offline keyword + pattern matching
// Based on AFlow & PsychAgent research (April 2026)

const EMOTIONAL_STATES = [
  'crisis',      // Immediate danger - triggers CrisisPopup
  'distressed',  // Overwhelmed, cannot cope
  'sad',         // Depressed, down, hopeless
  'anxious',     // Worried, scared, uncertainty
  'frustrated',  // Annoyed, angry at situation
  'neutral',     // Normal baseline
  'curious',     // Asking questions, interested
  'grateful',    // Thankful, appreciative
  'happy'        // Positive, joyful
];

// Crisis keywords - triggers immediate intervention
const CRISIS_PATTERNS = [
  /\bsuicid(e|al)\b/i,
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bwant to die\b/i,
  /\bno point living\b/i,
  /\bbetter off dead\b/i,
  /\bI can't go on\b/i,
  /\bhanging\b/i,
  /\bshooting\b/i,
  /\b overdose \b/i
];

// Distress: overwhelmed, coping difficulty
const DISTRESSED_PATTERNS = [
  /\boverwhelm(ed)?\b/i,
  /\bcan't handle\b/i,
  /\btoo much\b/i,
  /\bfalling apart\b/i,
  /\bbreaking down\b/i,
  /\bno control\b/i,
  /\bhelpless\b/i,
  /\bpowerless\b/i,
  /\bI give up\b/i
];

// Sadness: depression, hopelessness
const SAD_PATTERNS = [
  /\b(sad|depressed)\b/i,
  /\bhopeless\b/i,
  /\bworthless\b/i,
  /\bempty inside\b/i,
  /\bno energy\b/i,
  /\bcan't get out of bed\b/i,
  /\blost interest\b/i,
  /\blonely\b/i,
  /\balone\b/i,
  /\btearful\b/i,
  /\bcrying\b/i
];

// Anxiety: worry, fear, uncertainty
const ANXIOUS_PATTERNS = [
  /\b(anxious|worried)\b/i,
  /\bscared\b/i,
  /\bfear\b/i,
  /\bpanic\b/i,
  /\bwhat if\b/i,
  /\bcan't stop thinking\b/i,
  /\boverthinking\b/i,
  /\bheart racing\b/i,
  /\bbreathless\b/i,
  /\bracing thoughts\b/i,
  /\bterrified\b/i
];

// Frustration: anger, annoyance, injustice
const FRUSTRATED_PATTERNS = [
  /\b(frustrated|annoyed|angry)\b/i,
  /\bfed up\b/i,
  /\bsick of\b/i,
  /\bunfair\b/i,
  /\bfurious\b/i,
  /\bruined\b/i,
  /\brage\b/i,
  /\birritated\b/i
];

// Gratitude: thankful, appreciative
const GRATEFUL_PATTERNS = [
  /\bthank(s| you|ful)\b/i,
  /\bgrateful\b/i,
  /\bappreciate\b/i,
  /\bmeans a lot\b/i,
  /\bhelpful\b/i,
  /\bkind\b/i,
  /\bgood news\b/i
];

// Happiness: positive affect
const HAPPY_PATTERNS = [
  /\b(happy|glad|excited)\b/i,
  /\bjoy\b/i,
  /\bgreat\b/i,
  /\bawesome\b/i,
  /\bamazing\b/i,
  /\bwonderful\b/i,
  /\bdelighted\b/i,
  /\bproud\b/i,
  /\bcelebrate\b/i
];

// Curiosity: learning oriented
const CURIOUS_PATTERNS = [
  /\b(wonder|curious)\b/i,
  /\bhow does\b/i,
  /\bwhat is\b/i,
  /\bwhy\b/i,
  /\bexplain\b/i,
  /\btell me more\b/i,
  /\blearn\b/i,
  /\bunderstand\b/i
];

/**
 * Detect emotional state from user input text
 * @param {string} text - User message
 * @returns {object} { state: EMOTIONAL_STATES, confidence: 0-1, indicators: [] }
 */
export function detectEmotion(text) {
  if (!text || typeof text !== 'string') {
    return { state: 'neutral', confidence: 0.5, indicators: [] };
  }

  const lower = text.toLowerCase();
  const indicators = [];

  // Crisis detection (highest priority - immediate intervention)
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) {
      indicators.push({ state: 'crisis', match: text.match(pattern)[0], pattern: 'crisis' });
      return { state: 'crisis', confidence: 0.95, indicators };
    }
  }

  // Check each emotional category
  const patterns = [
    { state: 'distressed', patterns: DISTRESSED_PATTERNS },
    { state: 'sad', patterns: SAD_PATTERNS },
    { state: 'anxious', patterns: ANXIOUS_PATTERNS },
    { state: 'frustrated', patterns: FRUSTRATED_PATTERNS },
    { state: 'grateful', patterns: GRATEFUL_PATTERNS },
    { state: 'happy', patterns: HAPPY_PATTERNS },
    { state: 'curious', patterns: CURIOUS_PATTERNS }
  ];

  const scores = {};
  patterns.forEach(({ state, patterns: pList }) => {
    scores[state] = 0;
    pList.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        scores[state] += matches.length;
        matches.forEach(m => indicators.push({ state, match: m, pattern: pattern.toString() }));
      }
    });
  });

  // Determine dominant state
  const maxScore = Math.max(...Object.values(scores));
  let detectedState = 'neutral';
  let confidence = 0.5;

  if (maxScore >= 2) {
    // Strong signal
    const dominantStates = Object.keys(scores).filter(s => scores[s] === maxScore);
    // Priority order if tie: crisis > distressed > anxious > sad > frustrated > grateful > happy > curious
    const priority = ['crisis', 'distressed', 'anxious', 'sad', 'frustrated', 'grateful', 'happy', 'curious', 'neutral'];
    detectedState = dominantStates.sort((a, b) => priority.indexOf(a) - priority.indexOf(b))[0];
    confidence = Math.min(0.9, 0.5 + (maxScore * 0.15));
  } else if (maxScore === 1) {
    detectedState = Object.keys(scores).find(s => scores[s] === 1) || 'neutral';
    confidence = 0.6;
  } else {
    detectedState = 'neutral';
    confidence = 0.7;
  }

  return { state: detectedState, confidence, indicators };
}

/**
 * Get persona adjustment based on emotional state
 */
export function getEmotionalAdjustment(state) {
  const adjustments = {
    crisis: {
      tone: 'immediate-support',
      instruction: 'Prioritize safety and immediate resources. Do not leave the user alone. Provide crisis helpline numbers (988 in US). Validate their pain but gently guide toward professional help.',
      doNot: ['give medical advice', 'ask for details', 'overwhelm with options']
    },
    distressed: {
      tone: 'gentle-supportive',
      instruction: 'Be extra gentle and supportive. Validate their feelings. Use calming language. Avoid overwhelming detail. Check if they need to take a break.',
      doNot: ['rush', 'dismiss', 'minimize']
    },
    anxious: {
      tone: 'calm-grounding',
      instruction: 'Be calm and grounding. Use steady, predictable language. Avoid uncertain phrasing. Offer concrete next steps. Teach a simple breathing technique if appropriate.',
      doNot: ['overwhelm', 'speculate', 'add worry']
    },
    sad: {
      tone: 'compassionate',
      instruction: 'Show compassion and validation. Acknowledge their pain. Avoid toxic positivity. Offer hope in small doses. Suggest professional support if patterns suggest depression.',
      doNot: ['cheer up', 'ignore feelings', 'minimize']
    },
    frustrated: {
      tone: 'de-escalate',
      instruction: 'Acknowledge their frustration. Validate that the situation is difficult. Apologize for any system issues. Focus on solutions, not problems.',
      doNot: ['defend', 'argue', 'be defensive']
    },
    neutral: {
      tone: 'balanced',
      instruction: 'Provide balanced, helpful information.',
      doNot: []
    },
    curious: {
      tone: 'engaging',
      instruction: 'Be engaging and thorough. Satisfy their curiosity with detailed, accurate information.',
      doNot: ['be brief', 'cut off']
    },
    grateful: {
      tone: 'warm',
      instruction: 'Acknowledge their gratitude warmly. Reinforce positive coping. Celebrate progress.',
      doNot: ['brush off', 'be cold']
    },
    happy: {
      tone: 'positive',
      instruction: 'Match their positive tone. Encourage continued progress. Reinforce good habits.',
      doNot: ['dampen', 'dismiss']
    }
  };

  return adjustments[state] || adjustments.neutral;
}

export default {
  detectEmotion,
  getEmotionalAdjustment,
  EMOTIONAL_STATES
};
