// src/services/medicalAI.ts
// Medical AI Service - Hybrid Router Wrapper (Phase 3)
// Routes queries through hybridAIRouter (Gemma 4 online / TinyLlama offline)
// Integrates RAG context, persona system prompts, and role-based routing

import { routeQuery, getQuotaRemaining, getEmbedderStatus } from './hybridAIRouter';
import { getPersona, buildSystemPrompt } from './personaEngine';
import { isDatasetQuery, retrieveContext as retrieveRagContext, loadEmbeddingModel } from './ragEngine';

// Backward-compatible model state (reflects embedder status from hybrid router)
let modelLoaded = false;
let modelLoading = false;
let loadError = null;

/**
 * Load the medical AI (hybrid engine) - initializes embedding model
 */
export async function loadModel(onProgress) {
  if (modelLoaded) return;
  if (modelLoading) {
    while (modelLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (loadError) throw loadError;
    return;
  }

  modelLoading = true;
  try {
    // Load embedding model via advancedRAG (used by hybrid router)
    await loadEmbeddingModel();
    modelLoaded = true;
    modelLoading = false;
  } catch (err) {
    loadError = err;
    modelLoading = false;
    throw err;
  }
}

/**
 * Check if model is ready (embedder loaded)
 */
export function isModelReady() {
  return modelLoaded || getEmbedderStatus().loaded;
}

/**
 * Get model loading status (mirrors hybrid router embedder status)
 */
export function modelStatus() {
  if (modelLoaded) return { loaded: true, loading: false, error: null };
  if (loadError) return { loaded: false, loading: false, error: loadError.message };
  const embedderStatus = getEmbedderStatus();
  return {
    loaded: embedderStatus.loaded,
    loading: embedderStatus.loading,
    error: embedderStatus.error
  };
}

/**
 * Get quota status (delegated to hybrid router)
 */
export function getQuotaStatus() {
  return getQuotaRemaining();
}

/**
 * Build a clinical summary prompt from health data
 */
function buildClinicalSummaryPrompt(healthState, systemPrompt) {
  const { conditions, medications, allergies, encounters, immunizations } = healthState;

  let prompt = `Patient Health Summary:\n\n`;

  if (conditions.length > 0) {
    prompt += `**Conditions:**\n`;
    conditions.forEach((c) => {
      prompt += `- ${c.name} (diagnosed ${c.diagnosedDate})${c.notes ? ': ' + c.notes : ''}\n`;
    });
    prompt += '\n';
  }

  if (medications.length > 0) {
    prompt += `**Current Medications:**\n`;
    medications.forEach((m) => {
      prompt += `- ${m.name} ${m.dose} ${m.frequency}${m.endDate ? ' until ' + m.endDate : ''}\n`;
    });
    prompt += '\n';
  }

  if (allergies.length > 0) {
    prompt += `**Allergies:**\n`;
    allergies.forEach((a) => {
      prompt += `- ${a.substance} (reaction: ${a.reaction}, severity: ${a.severity || 'unspecified'})\n`;
    });
    prompt += '\n';
  }

  if (immunizations && immunizations.length > 0) {
    prompt += `**Immunizations:**\n`;
    immunizations.slice(-10).forEach((i) => {
      prompt += `- ${i.vaccine || 'Unknown vaccine'} (${i.date || 'date unknown'})\n`;
    });
    prompt += '\n';
  }

  if (encounters && encounters.length > 0) {
    prompt += `**Recent Encounters:**\n`;
    encounters.slice(-5).forEach((e) => {
      prompt += `- ${e.date} at ${e.facilityName}: ${e.reason}${e.notes ? ' — ' + e.notes : ''}\n`;
    });
    prompt += '\n';
  }

  prompt += `**Task:** Provide a concise 3-4 sentence summary highlighting key health concerns, current treatments, and any critical considerations. Use clear, professional language suitable for patient education.`;

  return prompt;
}

/**
 * Build a drug interaction prompt
 */
function buildDrugInteractionPrompt(currentMeds) {
  const medsList = currentMeds && currentMeds.length > 0
    ? currentMeds.join(', ')
    : 'No current medications listed';
  return `Check for potential drug interactions.\n\nCurrent medications: ${medsList}.\n\nProvide a brief risk assessment (low/moderate/high) and note any key concerns. If no known interactions, say "No significant interactions expected." Keep response under 3 sentences. Include standard medical disclaimer.`;
}

/**
 * Build a pre-visit specialist referral prompt
 */
function buildReferralSummaryPrompt(healthState, specialistType) {
  const { conditions, medications, allergies } = healthState;

  // Filter conditions relevant to specialist (keyword matching)
  const keywordsMap = {
    'cardiologist': ['heart', 'cardiac', 'hypertension', 'arrhythmia', 'coronary', 'valve', 'atrial', 'ventricular'],
    'endocrinologist': ['diabetes', 'thyroid', 'hormone', 'insulin', 'metabolism', 'adrenal', 'pituitary'],
    'neurologist': ['brain', 'stroke', 'seizure', 'epilepsy', 'neuropathy', 'multiple sclerosis', 'parkinson'],
    'orthopedic': ['bone', 'fracture', 'joint', 'arthritis', 'spine', 'osteoporosis'],
    'pulmonologist': ['lung', 'asthma', 'copd', 'pneumonia', 'breathing', 'respiratory'],
    'gastroenterologist': ['stomach', 'liver', 'intestine', 'colon', 'ibs', 'hepatitis', 'pancreas'],
    'nephrologist': ['kidney', 'renal', 'dialysis', 'glomerulonephritis'],
    'oncologist': ['cancer', 'tumor', 'chemotherapy', 'lymphoma', 'carcinoma']
  };

  const lowerSpecialty = specialistType.toLowerCase();
  const keywords = keywordsMap[lowerSpecialty] || [];
  const relevantConditions = conditions?.filter((c) => {
    const conditionLower = (c.name || '').toLowerCase();
    return keywords.some((kw) => conditionLower.includes(kw));
  }) || [];

  let prompt = `Prepare a pre-visit summary for a ${specialistType} appointment.\n\n`;

  if (relevantConditions.length > 0) {
    prompt += `**Relevant Conditions:**\n`;
    relevantConditions.forEach((c) => {
      prompt += `- ${c.name} (diagnosed ${c.diagnosedDate || 'unknown'})${c.notes ? ': ' + c.notes : ''}\n`;
    });
    prompt += '\n';
  }

  if (medications.length > 0) {
    prompt += `**Current Medications:**\n`;
    medications.forEach((m) => {
      prompt += `- ${m.name} ${m.dose} ${m.frequency}${m.endDate ? ' until ' + m.endDate : ''}\n`;
    });
    prompt += '\n';
  }

  if (allergies.length > 0) {
    prompt += `**Allergies:**\n`;
    allergies.forEach((a) => {
      prompt += `- ${a.substance} (reaction: ${a.reaction})\n`;
    });
    prompt += '\n';
  }

  prompt += `**Task:** Write a concise 2-3 sentence summary explaining why the patient is being referred to ${specialistType} and what the specialist should focus on. Include any critical background information.`;

  return prompt;
}

/**
 * Generate a clinical summary using the hybrid AI
 * @param healthState - Patient health data
 * @param personaSystemPrompt - Optional persona system prompt (defaults to patient persona)
 */
export async function generateClinicalSummary(healthState, personaSystemPrompt = null) {
  const userProfile = null; // Will use default persona
  const persona = getPersona('patient', userProfile);
  const systemPrompt = personaSystemPrompt || buildSystemPrompt(persona);

  const prompt = buildClinicalSummaryPrompt(healthState, systemPrompt);
  const result = await routeQuery(prompt, 'patient', systemPrompt);
  return result.text;
}

/**
 * Generate a pre-visit summary for a specialist
 * @param healthState - Patient health data
 * @param specialistType - Type of specialist (e.g., "cardiologist")
 */
export async function generatePreVisitSummary(healthState, specialistType) {
  const userProfile = null;
  const persona = getPersona('patient', userProfile);
  const systemPrompt = buildSystemPrompt(persona);

  const prompt = buildReferralSummaryPrompt(healthState, specialistType);
  const result = await routeQuery(prompt, 'patient', systemPrompt);
  return result.text;
}

/**
 * Use LLM to check medication interactions
 * @param medications - Array of medication names
 */
export async function checkMedicationInteractionLLM(medications) {
  const userProfile = null;
  const persona = getPersona('patient', userProfile);
  const systemPrompt = buildSystemPrompt(persona);

  const prompt = buildDrugInteractionPrompt(medications);
  const result = await routeQuery(prompt, 'patient', systemPrompt);
  return result.text;
}

/**
 * Ask a medical question with patient health context
 * @param healthState - Patient conditions, medications, allergies
 * @param question - User's question
 * @param personaSystemPrompt - Optional persona system prompt (RAG-augmented queries pass augmented prompt here)
 * @param role - User role: 'patient' | 'clinician' | 'chw' (default: 'patient')
 */
export async function askMedicalQuestion(healthState, question, personaSystemPrompt = null, role = 'patient') {
  const userProfile = null;
  const persona = getPersona(role, userProfile);
  const systemPrompt = personaSystemPrompt || buildSystemPrompt(persona);

  // Build context from health state
  const context = `Patient conditions: ${(healthState.conditions || []).map(c => c.name).join(', ') || 'None'}. ` +
                  `Medications: ${(healthState.medications || []).map(m => m.name).join(', ') || 'None'}. ` +
                  `Allergies: ${(healthState.allergies || []).map(a => a.substance).join(', ') || 'None'}.`;

  const prompt = `${context}\n\nQuestion: ${question}`;
  const result = await routeQuery(prompt, role, systemPrompt);
  return result.text;
}

/**
 * Check medication interactions (simple rule-based wrapper for backward compatibility)
 * @param medications - Array of { name, dose, frequency }
 */
export async function checkMedicationInteraction(medications) {
  // Simple non-LLM check (for backward compatibility)
  // In practice this would use a rule-based drug interaction database
  return { hasInteractions: false, message: 'Use LLM-based interaction checking via checkMedicationInteractionLLM()' };
}
