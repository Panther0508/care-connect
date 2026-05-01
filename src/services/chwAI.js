// src/services/chwAI.js
// Community Health Worker AI Service - Phase 3
// Routes CHW queries through Hybrid AI Router with WHO protocols

import { routeQuery, getQuotaRemaining } from './hybridAIRouter.js';
import { getPersona, buildSystemPrompt } from './personaEngine.js';

// CHW persona
const CHW_PERSONA = {
  name: 'Vita Community',
  role: 'chw',
  tone: 'practical, supportive, mission-driven',
  greeting: 'Vita Community here — your AI field assistant. I run offline. How can I help?',
  systemPrompt: `You are Vita Community, a practical, supportive AI for community health workers. 
Use simple, clear language. Reference WHO IMCI/ANC protocols. Always prioritize danger sign recognition. 
Be encouraging — this work saves lives. Include disclaimers. You run lightweight model entirely on-device. 
If you detect self-harm or danger: <<VITACHAIN_CRISIS_DETECTED>>`
};

/**
 * Process CHW query through hybrid router
 */
export async function processCHWQuery(prompt, options = {}) {
  const { context, location, language = 'English' } = options;

  const quota = getQuotaRemaining();
  const systemPrompt = buildSystemPrompt(CHW_PERSONA);

  let enrichedPrompt = prompt;
  if (context) {
    enrichedPrompt = `Context: ${context}\n\n${prompt}`;
  }
  if (location) {
    enrichedPrompt = `Location: ${location}\n${enrichedPrompt}`;
  }

  const result = await routeQuery(enrichedPrompt, 'chw', systemPrompt);

  return {
    success: true,
    text: result.text,
    model: result.model,
    source: result.source,
    quotaRemaining: quota.remaining,
    language,
    timestamp: new Date().toISOString()
  };
}

/**
 * Triage symptoms using WHO IMCI guidelines
 */
export async function triageSymptoms(symptoms, options = {}) {
  const { patientAge, location, dangerSigns = [] } = options;

  const prompt = `Triage patient with symptoms: ${symptoms}\n` +
    `Age: ${patientAge || 'unknown'}\n` +
    `Location: ${location || 'community'}\n` +
    `Known danger signs: ${dangerSigns.join(', ') || 'none'}\n` +
    `Use WHO IMCI guidelines. Classify as: URGENT/REFER, SPECIFIC TREATMENT, or HOME CARE.\n` +
    `Provide clear actions and follow-up.`;

  return await processCHWQuery(prompt, options);
}

/**
 * Follow WHO protocol for specific condition
 */
export async function followProtocol(condition, options = {}) {
  const { protocolType = 'IMCI', resourcesAvailable = ['basic'] } = options;

  const prompt = `Follow ${protocolType} protocol for: ${condition}\n` +
    `Resources: ${resourcesAvailable.join(', ')}\n` +
    `Provide step-by-step guide for CHW.`;

  return await processCHWQuery(prompt, options);
}

/**
 * Detect danger signs requiring immediate referral
 */
export async function detectDangerSigns(symptoms, observations, options = {}) {
  const prompt = `Check for danger signs:\n` +
    `Symptoms: ${symptoms}\n` +
    `Observations: ${observations}\n` +
    `List all critical danger signs requiring immediate referral per WHO protocols.`;

  return await processCHWQuery(prompt, options);
}

/**
 * Generate counseling script
 */
export async function generateCounselingScript(topic, targetGroup, options = {}) {
  const { keyPoints = [], duration = 'brief' } = options;

  const prompt = `Create counseling script for: ${topic}\n` +
    `Target: ${targetGroup}\n` +
    `Duration: ${duration}\n` +
    `Key points: ${keyPoints.join(', ') || 'standard'}\n` +
    `Use respectful, empowering language for community setting.`;

  return await processCHWQuery(prompt, options);
}

/**
 * Generate health education message
 */
export async function generateHealthMessage(topic, options = {}) {
  const { format = 'conversation', culturalContext = 'general' } = options;

  const prompt = `Create health education message about: ${topic}\n` +
    `Format: ${format}\n` +
    `Cultural context: ${culturalContext}\n` +
    `Simple, actionable, respectful messaging.`;

  return await processCHWQuery(prompt, options);
}

/**
 * Structure encounter documentation
 */
export async function structureEncounter(data, options = {}) {
  const { patientInfo, findings, actions, followUp } = data;

  const prompt = `Structure CHW encounter:\n` +
    `Patient: ${patientInfo}\n` +
    `Findings: ${findings}\n` +
    `Actions: ${actions}\n` +
    `Follow-up: ${followUp}\n` +
    `Format as clear, structured report for records.`;

  return await processCHWQuery(prompt, options);
}

/**
 * ANC (Antenatal Care) guidance
 */
export async function provideANCguidance(gestationalAge, concerns, options = {}) {
  const prompt = `ANC guidance for gestational age: ${gestationalAge} weeks\n` +
    `Concerns: ${concerns || 'routine'}\n` +
    `Use WHO ANC protocol. Provide checklist for this visit.`;

  return await processCHWQuery(prompt, options);
}

/**
 * Get quota status
 */
export function getCHWQuota() {
  return getQuotaRemaining();
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