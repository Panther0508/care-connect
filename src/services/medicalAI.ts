// src/services/medicalAI.ts
// Medical AI Service — Thin wrapper around aiCoreRouter
// All prompt logic lives in promptLibrary; routing logic lives in aiCoreRouter

import { routeQuery, loadEmbedder as aiLoadEmbedder, getQuotaRemaining } from './aiCoreRouter.js';
import { buildStructuredPrompt, buildPatientTaskPrompt } from './promptLibrary.js';

// Legacy model state tracking (for UI components)
let modelLoaded = false;
let modelLoading = false;
let loadError = null;

/**
 * Load the medical AI — initializes embedding model (deferred until first interaction)
 */
export async function loadModel(onProgress?: (pct: number) => void) {
  if (modelLoaded) return;
  if (modelLoading) {
    while (modelLoading) { await new Promise(r => setTimeout(r, 50)); }
    if (loadError) throw loadError;
    return;
  }

  modelLoading = true;
  try {
    // Load embedder via aiCoreRouter (cached singleton)
    await aiLoadEmbedder();
    modelLoaded = true;
    modelLoading = false;
  } catch (err) {
    loadError = err;
    modelLoading = false;
    throw err;
  }
}

/**
 * Check if model (embedder) is ready
 */
export function isModelReady() {
  return modelLoaded;
}

/**
 * Get detailed model load status
 */
export function modelStatus() {
  if (modelLoaded) return { loaded: true, loading: false, error: null };
  if (loadError) return { loaded: false, loading: false, error: loadError.message };
  return { loaded: false, loading: modelLoading, error: null };
}

/**
 * Get quota status (delegated to aiCoreRouter)
 */
export function getQuotaStatus() {
  return getQuotaRemaining();
}

/**
 * Generate clinical summary
 */
export async function generateClinicalSummary(healthState, personaSystemPrompt = null, userId = 'guest') {
  const taskPrompt = buildClinicalSummaryTask(healthState);
  const structuredPrompt = buildStructuredPrompt('patient', taskPrompt, { healthContext: healthState });
  // Extract query: summarize health state concisely
  const extractedQuery = 'Patient health summary: ' + 
    [(healthState.conditions || []).map(c => c.name).join(', '), 
     (healthState.medications || []).map(m => m.name).join(', ')]
    .filter(Boolean).join('; ') || 'health summary';
  const result = await routeQuery({ structuredPrompt, role: 'patient', userId, extractedQuery });
  return result;
}

/**
 * Pre-visit specialist referral summary
 */
export async function generatePreVisitSummary(healthState, specialistType, userId = 'guest') {
  const taskPrompt = buildReferralTask(specialistType, healthState);
  const structuredPrompt = buildStructuredPrompt('patient', taskPrompt, { healthContext: healthState });
  const extractedQuery = `${specialistType} referral summary`;
  const result = await routeQuery({ structuredPrompt, role: 'patient', userId, extractedQuery });
  return result;
}

/**
 * LLM-based drug interaction check
 */
export async function checkMedicationInteractionLLM(medications, userId = 'guest') {
  const taskPrompt = buildDrugInteractionTask(medications);
  const structuredPrompt = buildStructuredPrompt('patient', taskPrompt);
  const extractedQuery = `Drug interactions: ${medications.join(', ')}`;
  const result = await routeQuery({ structuredPrompt, role: 'patient', userId, extractedQuery });
  return result;
}

/**
 * Ask medical question with health context
 */
export async function askMedicalQuestion(healthState, question, personaSystemPrompt = null, role = 'patient', userId = 'guest') {
  const taskPrompt = buildPatientTaskPrompt(healthState, question);
  const structuredPrompt = buildStructuredPrompt(role, taskPrompt, { healthContext: healthState });
  // Use the original user question for web search
  const result = await routeQuery({ structuredPrompt, role, userId, extractedQuery: question });
  return result;
}

/**
 * Legacy: Simple rule-based interaction check
 */
export async function checkMedicationInteraction(medications) {
  return { hasInteractions: false, message: 'Use checkMedicationInteractionLLM() for LLM-based check.' };
}

// ─── Task builder helpers (inline for now; can be promoted to promptLibrary later) ───
function buildClinicalSummaryTask(healthState) {
  return `Patient health summary:
Conditions: ${(healthState.conditions || []).map(c => c.name).join(', ') || 'none'}
Meds: ${(healthState.medications || []).map(m => m.name).join(', ') || 'none'}
Allergies: ${(healthState.allergies || []).map(a => a.substance).join(', ') || 'none'}

Provide a concise 3–4 sentence summary highlighting key health concerns, current treatments, and critical considerations. Use clear professional language suitable for patient education.`;
}
function buildReferralTask(specialistType, healthState) {
  return `Pre-visit summary for ${specialistType} appointment.
Patient conditions: ${(healthState.conditions || []).map(c => c.name).join(', ') || 'none'}
Meds: ${(healthState.medications || []).map(m => m.name).join(', ') || 'none'}
Allergies: ${(healthState.allergies || []).map(a => a.substance).join(', ') || 'none'}

Explain referral reason and specialist focus. Include critical background. 2–3 sentences.`;
}
function buildDrugInteractionTask(medications) {
  const medsList = medications && medications.length > 0 ? medications.join(', ') : 'No current meds listed';
  return `Check drug interactions for: ${medsList}.

Provide: risk level (low/moderate/high), key concerns, standard disclaimer. Keep under 3 sentences.`;
}
function buildPatientTaskPrompt(healthContext, userQuestion) {
  let prompt = `Patient profile:
- Conditions: ${(healthContext.conditions || []).map(c => c.name).join(', ') || 'none'}
- Medications: ${(healthContext.medications || []).map(m => `${m.name} ${m.dose} ${m.frequency}`).join(', ') || 'none'}
- Allergies: ${(healthContext.allergies || []).map(a => a.substance).join(', ') || 'none'}

Question: ${userQuestion}

Provide clear, compassionate, evidence-based response in plain language. Definemedical terms. Highlight key takeaways. Cite sources from medical literature.`;
  return prompt;
}
