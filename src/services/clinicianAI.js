// src/services/clinicianAI.js
// Clinician AI Service - Phase 3
// Routes clinician queries through Hybrid AI Router

import { routeQuery, getQuotaRemaining } from './hybridAIRouter.js';
import { getPersona, buildSystemPrompt } from './personaEngine.js';

// Clinician persona
const CLINICIAN_PERSONA = {
  name: 'Vita Clinical',
  role: 'clinician',
  tone: 'precise, evidence-based, collegial',
  greeting: 'Vita Clinical here — decision-support AI. How can I assist?',
  systemPrompt: `You are Vita Clinical, a precise, evidence-based clinical decision-support AI. 
Use medical terminology appropriately. Always cite reasoning. Flag uncertainty. 
Include disclaimers. You are powered by hybrid AI (Gemma 4 online, TinyLlama offline). 
If you detect self-harm risk, use: <<VITACHAIN_CRISIS_DETECTED>>`
};

/**
 * Process clinician query through hybrid router
 */
export async function processClinicianQuery(prompt, options = {}) {
  const { context, patientData, structuredOutput: needStructured = false } = options;

  // Get quota status
  const quota = getQuotaRemaining();
  const systemPrompt = buildSystemPrompt(CLINICIAN_PERSONA);

  // Build enriched prompt with context
  let enrichedPrompt = prompt;
  if (context) {
    enrichedPrompt = `Clinical Context:\n${context}\n\nQuestion: ${prompt}`;
  }

  if (patientData) {
    const { conditions = [], medications = [], allergies = [] } = patientData;
    const patientSummary = `Patient has: ${conditions.join(', ') || 'no conditions'}. ` +
      `Medications: ${medications.join(', ') || 'none'}. ` +
      `Allergies: ${allergies.join(', ') || 'none'}.`;
    enrichedPrompt = `${patientSummary}\n\n${enrichedPrompt}`;
  }

  // Route through hybrid router
  const result = await routeQuery(enrichedPrompt, 'clinician', systemPrompt);

  return {
    success: true,
    text: result.text,
    model: result.model,
    source: result.source,
    quotaRemaining: quota.remaining,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate differential diagnosis
 */
export async function generateDifferential(symptoms, options = {}) {
  const { patientAge, patientSex, maxDiagnoses = 5 } = options;

  const prompt = `Generate differential diagnosis for: ${symptoms}\n` +
    `Patient: ${patientAge || 'unknown'} years, ${patientSex || 'unknown'} sex\n` +
    `Format: Ranked list with likelihood, key findings, red flags, and workup.`;

  return await processClinicianQuery(prompt, options);
}

/**
 * Suggest ICD-10 codes
 */
export async function suggestICD10(conditions, options = {}) {
  const prompt = `Suggest relevant ICD-10 codes for: ${conditions}\n` +
    `Provide primary and secondary codes with brief descriptions.`;

  return await processClinicianQuery(prompt, options);
}

/**
 * Check prescribing considerations
 */
export async function assistPrescribing(drugInfo, options = {}) {
  const { patientConditions = [], patientAllergies = [] } = options;

  const prompt = `Prescribing considerations for: ${drugInfo}\n` +
    `Patient conditions: ${patientConditions.join(', ') || 'none'}\n` +
    `Patient allergies: ${patientAllergies.join(', ') || 'none'}\n` +
    `Provide dosing, interactions, contraindications, and monitoring.`;

  return await processClinicianQuery(prompt, options);
}

/**
 * Generate referral note
 */
export async function generateReferral(reason, specialty, options = {}) {
  const { patientSummary = '', urgency = 'routine' } = options;

  const prompt = `Generate referral note to ${specialty} for: ${reason}\n` +
    `Patient summary: ${patientSummary}\n` +
    `Urgency: ${urgency}\n` +
    `Format: Professional referral letter with key points.`;

  return await processClinicianQuery(prompt, options);
}

/**
 * Structure clinical note
 */
export async function structureNote(noteType, findings, options = {}) {
  const templates = {
    SOAP: `Subjective: {subjective}\nObjective: {objective}\nAssessment: {assessment}\nPlan: {plan}`,
    Brief: `Chief complaint: {cc}\nKey findings: {findings}\nPlan: {plan}`,
    Discharge: `Dx: {diagnosis}\nCourse: {course}\nDispo: {disposition}\nFollowup: {followup}`
  };

  const prompt = `Structure this clinical note as ${noteType}:\n${findings}\n` +
    `Use format: ${templates[noteType] || templates.Brief}`;

  return await processClinicianQuery(prompt, options);
}

/**
 * Get quota status
 */
export function getClinicianQuota() {
  return getQuotaRemaining();
}

export default {
  processClinicianQuery,
  generateDifferential,
  suggestICD10,
  assistPrescribing,
  generateReferral,
  structureNote,
  getClinicianQuota
};