// src/services/safetyGuardrails.js
// SAFETY GUARDRAILS — FILTER DANGEROUS AI OUTPUT
// Injects crisis resources, redacts unsafe statements, adds role-based disclaimers

// Prohibited patterns (detect unsafe/misleading claims)
const PROHIBITED_PATTERNS = [
  // Diagnostic overreach
  /\byou (?:have|suffer from|are|show)\s+(?:definite|clear|certain)\s+(?:cancer|tumor|malignant|terminal|death|fatal)\b/i,
  /\b(?:I (?:diagnose|prescribe)|this (?:is|definitely|certainly)\s+(?:cancer|tumor|malignant))\b/i,
  // Direct prescription
  /\byou should|I recommend|take|start|use|stop|discontinue\s+(?:your|the)\s+(?:medication|treatment|pill|drug)\b/i,
  // Overdose/poison
  /\b(?:overdose|poison|toxic|fatal|lethal)\s+(?:dose|amount|level)\b/i,
  // DIY dangerous treatment
  /\b(?:treat|cure|heal|eliminate|remove)\s+(?:yourself|on your own)\s+(?:cancer|tumor|disease)\b/i,
  // False certainty
  /\b(?:100%|absolutely|certainly|guaranteed|always|never)\s+(?:cure|heal|work|effective)\b/i
];

// Template leakage patterns (internal markers that must never appear in user-facing output)
const TEMPLATE_LEAK_PATTERNS = [
  /\*?\s*Plain language\?\s*Yes/i,
  /\*?\s*Defined terms\?/i,
  /\*?\s*No diagnosis\?/i,
  /\*?\s*No prescribing\?/i,
  /\*?\s*Citations included\?/i,
  /\*?\s*Correct phrasing\?/i,
  /\*?\s*Format followed\?/i,
  /\*?\s*Checkmarks?:?\s*✓/i,
  /^--+ SECTION \d+ --+$/i,
  /^OUTPUT FORMAT/i,
  /^QUALITY RULES/i,
  /^SECTION \d+:?\s*$/i,
  /\b(?:Self-evaluation|Quality check|Template test|Section \d+)\b/i
];

// Template leakage patterns (internal evaluation markers that should never appear in output)
const TEMPLATE_LEAK_PATTERNS = [
  /\*?\s*Plain language\?\s*Yes/i,
  /\*?\s*Defined terms\?/i,
  /\*?\s*No diagnosis\?/i,
  /\*?\s*No prescribing\?/i,
  /\*?\s*Citations included\?/i,
  /\*?\s*Correct phrasing\?/i,
  /\*?\s*Format followed\?/i,
  /\*?\s*Checkmarks?:?\s*✓/i,
  /^--+ SECTION \d+ --+$/i,
  /^OUTPUT FORMAT/i,
  /^QUALITY RULES/i,
  /^SECTION \d+:?\s*$/i,
  /\b(?:Self-evaluation|Quality check|Template test)\b/i
];

// Crisis keyword triggers (requires immediate resource offer)
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
  'self-harm', 'cut myself', 'hurt myself', 'can\'t go on',
  'no reason to live', 'worthless', 'hopeless'
];

/**
 * Clean and sanitize AI response
 * @param {string} rawText - Unfiltered AI output
 * @param {string} role - 'patient' | 'clinician' | 'chw'
 * @returns {string} Sanitized response
 */
export function applyGuardrails(rawText, role = 'patient') {
  if (!rawText || typeof rawText !== 'string') return rawText;

  let cleaned = rawText;

  // 1. Check for crisis language
  const isCrisis = CRISIS_KEYWORDS.some(phrase => cleaned.toLowerCase().includes(phrase));

   // 2. Redact prohibited content
   for (const pattern of PROHIBITED_PATTERNS) {
     if (pattern.test(cleaned)) {
       cleaned = cleaned.replace(pattern, '[REDACTED — consult a healthcare professional directly]');
     }
   }

   // 3. Remove template leakage (internal evaluation markers)
   for (const pattern of TEMPLATE_LEAK_PATTERNS) {
     if (pattern.test(cleaned)) {
       // If we detect template leakage, replace entire response with clean fallback
       cleaned = 'I am temporarily unable to provide a complete response. Please try again in a moment, or contact a healthcare provider for immediate assistance.';
       break;
     }
   }

  // 3. Inject crisis resources if detected
  if (isCrisis) {
    const crisisResources = `
  
⚠️ **If you are in crisis, please reach out immediately:**
- **US/Canada:** Call or text 988 (Suicide & Crisis Lifeline)
- **UK:** Call 116 123 (Samaritans)
- **India:** Call 9152987821 (iCall) or 91 9820466726 (Vandrevala Foundation)
- **Global:** Find a crisis center at https://findahelpline.com/

You are not alone. Help is available 24/7. Please speak with a mental health professional or go to your nearest emergency room.`;
    cleaned = cleaned.trim() + crisisResources;
  }

  // 4. Append role-specific disclaimer
  const disclaimers = {
    patient: `

---
**Important:** I am an AI assistant, not a doctor. This information is for educational purposes only and does not constitute medical advice. Always consult your healthcare provider for diagnosis and treatment.`,
    clinician: `

---
**Clinical Disclaimer:** AI-generated assistance. Please verify all information against current clinical guidelines, institutional protocols, and your professional judgment before acting.`,
    chw: `

---
**Field Reminder:** This guidance does not replace formal medical training. Escalate to a supervising clinician when uncertain or if red flags are present.`
  };

  cleaned = cleaned + (disclaimers[role] || disclaimers.patient);

  // 5. Ensure uncertainty qualifiers are present for certain statements
  const absoluteClaims = [
    /\b(?:will|certainly|definitely|always|never|guaranteed)\s+(?:cure|heal|fix|resolve|eliminate)/i,
    /\b(?:the\s+(?:only|best|correct)\s+(?:treatment|diagnosis|solution))/i
  ];

  for (const pattern of absoluteClaims) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, match => `[typically/usually] ${match.replace(/will/g, 'will likely').replace(/certainly/g, 'likely').replace(/definitely/g, 'probably')}`);
    }
  }

  return cleaned;
}

/**
 * Quick safety check before sending to AI
 * @param {string} prompt - User's input
 * @returns {boolean} True if prompt is safe to process
 */
export function isPromptSafe(prompt) {
  if (!prompt) return false;
  const lower = prompt.toLowerCase();
  // Detect immediately dangerous self-harm keywords
  const dangerous = CRISIS_KEYWORDS.some(k => lower.includes(k));
  // Detect jailbreak attempts
  const jailbreak = /\b(?:ignore|forget|disregard|bypass)\s+(?:all|your|these)\s+(?:rules|instructions|safety|guardrails)\b/i.test(prompt);
  // Excessive profanity
  const profane = /(?:fuck|shit|bitch|asshole|damn){3,}/i.test(prompt);

  return !dangerous && !jailbreak && !profane;
}

/**
 * Highlight warnings in response
 * @param {string} text - Response text
 * @returns {string[]} Array of warning types detected
 */
export function detectWarnings(text) {
  const warnings = [];
  if (!text) return warnings;

  if (/seek.*(?:emergency|immediate|help|medical)/i.test(text)) warnings.push('urgency_mention');
  if (/drug.*(?:interaction|side effect|adverse)/i.test(text)) warnings.push('drug_safety');
  if (/(?:danger sign|red flag|refer now|urgent)/i.test(text)) warnings.push('danger_sign');
  if (/(?:consult|physician|healthcare provider)/i.test(text)) warnings.push('disclaimer_present');
  if (/(?:may|might|could|possible|potential)/i.test(text)) warnings.push('uncertainty_present');

  return warnings;
}
