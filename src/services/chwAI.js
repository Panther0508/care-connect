// src/services/chwAI.js
// Community Health Worker AI — Thin wrapper around aiCoreRouter
// All logic in promptLibrary / aiCoreRouter

import { routeQuery, getQuotaRemaining } from './aiCoreRouter.js';
import { buildStructuredPrompt } from './promptLibrary.js';

const CHW_SYSTEM_PROMPT = `You are Vita Community, a practical AI field assistant for community health workers.
Use simple, clear language. Reference WHO IMCI and ANC protocols. Prioritize danger sign recognition.
Be encouraging — this work saves lives. Include disclaimers.
Powered by VitaChain hybrid AI (Gemma 4 online, TinyLlama offline). Always accessible offline.
If self-harm or danger detected: <<VITACHAIN_CRISIS_DETECTED>>`;

/**
 * Process general CHW query
 */
export async function processCHWQuery(prompt, options = {}) {
  const { context, location, language = 'English' } = options;

  let mainPrompt = prompt;
  if (context) mainPrompt = `Context: ${context}\n\n${prompt}`;
  if (location) mainPrompt = `Location: ${location}\n${mainPrompt}`;

  const { structuredPrompt } = buildStructuredPrompt('chw', mainPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'chw', userId: 'chw', extractedQuery: prompt });

  return {
    success: true,
    text: result.text,
    model: result.model,
    source: result.source,
    evaluation: result.evaluation,
    emotionalState: result.emotionalState,
    language,
    timestamp: new Date().toISOString()
  };
}

/**
 * Symptom triage using WHO IMCI
 */
export async function triageSymptoms(symptoms, options = {}) {
  const { patientAge, location, dangerSigns = [] } = options;

   const taskPrompt = `Triage patient with symptoms: ${symptoms}
Age: ${patientAge || 'unknown'}
Location: ${location || 'community'}
Known danger signs: ${dangerSigns.join(', ') || 'none'}

Use WHO IMCI/ANC guidelines. Classify as:
🔴 URGENT/REFER — immediate facility transfer
🟡 SPECIFIC TREATMENT — on-site intervention + follow-up
🟢 HOME CARE — safety-net advice

Provide clear actions and caregiver instructions.`;

  const { structuredPrompt } = buildStructuredPrompt('chw', taskPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'chw', extractedQuery: symptoms });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * Follow WHO protocol for a condition
 */
export async function followProtocol(condition, options = {}) {
  const { protocolType = 'IMCI', resourcesAvailable = ['basic'] } = options;

   const taskPrompt = `Follow ${protocolType} protocol for: ${condition}
Available resources: ${resourcesAvailable.join(', ')}

Provide step-by-step CHW management guide including:
- Assessment checklist
- Treatment actions (what, how, dosage if applicable)
- Referral criteria
- Counseling points for caregiver`;

  const { structuredPrompt } = buildStructuredPrompt('chw', taskPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'chw', extractedQuery: condition });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * Danger sign detection (WHO standard)
 */
export async function detectDangerSigns(symptoms, observations, options = {}) {
   const taskPrompt = `Check for danger signs requiring immediate referral.

Symptoms: ${symptoms}
Observations: ${observations}

List ALL critical danger signs per WHO IMCI/ANC.
For each: explain why dangerous and required action (REFER NOW).`;

  const { structuredPrompt } = buildStructuredPrompt('chw', taskPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'chw', extractedQuery: symptoms });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * Counseling script generator
 */
export async function generateCounselingScript(topic, targetGroup, options = {}) {
  const { keyPoints = [], duration = 'brief' } = options;

   const taskPrompt = `Create counseling script for: ${topic}
Target: ${targetGroup}
Duration: ${duration}
Key points: ${keyPoints.join(', ') || 'standard guidance'}

Use respectful, empowering language for community setting.
Make it interactive — include questions to ask the beneficiary.
End with key message summary.`;

  const { structuredPrompt } = buildStructuredPrompt('chw', taskPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'chw', extractedQuery: topic });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * Health education message
 */
export async function generateHealthMessage(topic, options = {}) {
  const { format = 'conversation', culturalContext = 'general' } = options;

   const taskPrompt = `Create health education message about: ${topic}
Format: ${format}
Cultural context: ${culturalContext}

Requirements:
- Simple, actionable advice
- Culturally respectful
- 3–5 key takeaways
- No jargon without explanation
- Closing: "Do you have questions?"`;

  const { structuredPrompt } = buildStructuredPrompt('chw', taskPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'chw', extractedQuery: topic });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * Encounter documentation
 */
export async function structureEncounter(data, options = {}) {
  const { patientInfo, findings, actions, followUp } = data;

   const taskPrompt = `Structure CHW encounter report.

Patient: ${patientInfo}
Findings: ${findings}
Actions taken: ${actions}
Follow-up plan: ${followUp || 'none yet'}

Format as clear, structured report for medical records. Include:
- Date/time
- Chief complaint
- Assessment
- Interventions
- Referral (if any)
- Next appointment`;

  const { structuredPrompt } = buildStructuredPrompt('chw', taskPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'chw', extractedQuery: findings });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * ANC guidance (WHO antenatal care)
 */
export async function provideANCguidance(gestationalAge, concerns, options = {}) {
  const taskPrompt = `ANC guidance for gestational age: ${gestationalAge} weeks
Concerns: ${concerns || 'routine'}

Use WHO ANC 2016 protocol.
Provide visit checklist and danger sign screen for this gestational age.
Include: vitals, immunizations, nutrition, birth planning, red flags.`;

  const { structuredPrompt } = buildStructuredPrompt('chw', taskPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'chw', extractedQuery: concerns || `ANC at ${gestationalAge} weeks` });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * Quota check
 */
export function getCHWQuota() {
  return getQuotaRemaining ? getQuotaRemaining() : Promise.resolve({ used: 0, remaining: 1500, resetAt: new Date().toISOString() });
}

export default {
  processCHWQuery,
  triageSymptoms,
  followProtocol,
  detectDangerSigns,
  generateCounselingScript,
  generateHealthMessage,
  structureEncounter,
  provideANCguidance,
  getCHWQuota
};
