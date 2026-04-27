// src/services/medicalAI.ts
// On-device medical AI using Transformers.js + Gemma 2B

import { pipeline, env } from '@xenova/transformers';

// Skip local model checks, use remote only
env.allowLocalModels = false;
env.useBrowserCache = true;

let generator: any = null;
let modelLoading = false;
let modelLoaded = false;
let loadError: Error | null = null;

const MODEL_NAME = 'Xenova/gemma-2-2b-it'; // or fallback to 'Xenova/gemma-1.1-2b-it'

/**
 * Load the Gemma text-generation model
 * Called once on first use
 */
export async function loadModel(): Promise<void> {
  if (modelLoaded) return;
  if (modelLoading) {
    // Wait for ongoing load
    while (modelLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (loadError) throw loadError;
    return;
  }

  modelLoading = true;
  try {
    generator = await pipeline('text-generation', MODEL_NAME, {
      progress_callback: (progress: any) => {
        // Progress can be used for UI loading bar if needed
      },
    });
    modelLoaded = true;
  } catch (err: any) {
    console.error('Failed to load Gemma model:', err);
    loadError = err;
    throw err;
  } finally {
    modelLoading = false;
  }
}

/**
 * Check if model is ready
 */
export function isModelReady(): boolean {
  return modelLoaded;
}

/**
 * Build a clinical summary prompt from health data
 */
function buildClinicalSummaryPrompt(healthState: any): string {
  const { conditions, medications, allergies, encounters } = healthState;

  let prompt = `You are a medical assistant summarizing a patient's health history for a clinician. Be concise and structured.\n\n`;

  if (conditions.length > 0) {
    prompt += `**Conditions:**\n`;
    conditions.forEach((c: any) => {
      prompt += `- ${c.name} (diagnosed ${c.diagnosedDate})${c.notes ? ': ' + c.notes : ''}\n`;
    });
    prompt += '\n';
  }

  if (medications.length > 0) {
    prompt += `**Current Medications:**\n`;
    medications.forEach((m: any) => {
      prompt += `- ${m.name} ${m.dose} ${m.frequency}${m.endDate ? ' until ' + m.endDate : ''}\n`;
    });
    prompt += '\n';
  }

  if (allergies.length > 0) {
    prompt += `**Allergies:**\n`;
    allergies.forEach((a: any) => {
      prompt += `- ${a.substance} (reaction: ${a.reaction}, severity: ${a.severity})\n`;
    });
    prompt += '\n';
  }

  if (encounters.length > 0) {
    prompt += `**Recent Encounters:**\n`;
    encounters.slice(-5).forEach((e: any) => {
      prompt += `- ${e.date} at ${e.facilityName}: ${e.reason}${e.notes ? ' — ' + e.notes : ''}\n`;
    });
    prompt += '\n';
  }

  prompt += `**Summary:**\nProvide a brief 3-4 sentence summary highlighting key health concerns, current treatments, and any critical considerations for the clinician.`;

  return prompt;
}

/**
 * Build a pre-visit summary prompt tailored to a specialist
 */
function buildPreVisitPrompt(healthState: any, specialistType: string): string {
  const { conditions, medications, allergies, encounters } = healthState;

  let prompt = `You are preparing a patient summary for a ${specialistType} appointment. Extract and highlight only the relevant information for this specialty. Be concise.\n\n`;

  // Filter conditions that might be relevant (simple keyword matching for demo)
  const relevantConditions = conditions.filter((c: any) =>
    isRelevantToSpecialty(c.name, specialistType)
  );

  if (relevantConditions.length > 0) {
    prompt += `**Relevant Conditions:**\n`;
    relevantConditions.forEach((c: any) => {
      prompt += `- ${c.name} (${c.diagnosedDate})\n`;
    });
    prompt += '\n';
  }

  if (medications.length > 0) {
    prompt += `**Current Medications:**\n`;
    medications.forEach((m: any) => {
      prompt += `- ${m.name} ${m.dose} ${m.frequency}\n`;
    });
    prompt += '\n';
  }

  if (allergies.length > 0) {
    prompt += `**Allergies:**\n`;
    allergies.forEach((a: any) => {
      prompt += `- ${a.substance}\n`;
    });
    prompt += '\n';
  }

  prompt += `**Summary for ${specialistType}:**\nWrite 2-3 sentences focusing on why the patient is being referred and what the specialist should know.`;

  return prompt;
}

/**
 * Determine if a condition is relevant to a specialty (simple keyword matching)
 */
function isRelevantToSpecialty(conditionName: string, specialty: string): boolean {
  const conditionLower = conditionName.toLowerCase();
  const specialtyLower = specialty.toLowerCase();

  const relevanceMap: Record<string, string[]> = {
    cardiologist: ['heart', 'cardiac', 'hypertension', 'arrhythmia', 'coronary', 'valve', 'atrial', 'ventricular'],
    endocrinologist: ['diabetes', 'thyroid', 'hormone', 'insulin', 'metabolism', 'adrenal', 'pituitary'],
    neurologist: ['brain', 'stroke', 'seizure', 'epilepsy', 'neuropathy', 'multiple sclerosis', 'parkinson'],
    orthopedic: ['bone', 'fracture', 'joint', 'arthritis', 'spine', 'osteoporosis'],
    pulmonologist: ['lung', 'asthma', 'copd', 'pneumonia', 'breathing', 'respiratory'],
    gastroenterologist: ['stomach', 'liver', 'intestine', 'colon', 'ibs', 'hepatitis', 'pancreas'],
    nephrologist: ['kidney', 'renal', 'dialysis', 'glomerulonephritis'],
    oncologist: ['cancer', 'tumor', 'chemotherapy', 'lymphoma', 'carcinoma'],
  };

  const keywords = relevanceMap[specialtyLower] || [];
  return keywords.some((kw) => conditionLower.includes(kw));
}

/**
 * Generate a clinical summary using the LLM
 */
export async function generateClinicalSummary(healthState: any): Promise<string> {
  if (!modelLoaded) {
    await loadModel();
  }

  const prompt = buildClinicalSummaryPrompt(healthState);
  const fullPrompt = `<start_of_turn>user\n${prompt}<end_of_turn>\n<start_of_turn>model\n`;

  try {
    const output = await generator(fullPrompt, {
      max_new_tokens: 256,
      temperature: 0.3,
      do_sample: true,
      top_k: 20,
      top_p: 0.9,
    });

    const generatedText = output[0]?.generated_text || '';
    // Extract just the model's response (after the prompt)
    const response = generatedText.replace(fullPrompt, '').trim();
    return response || 'Unable to generate summary at this time.';
  } catch (err) {
    console.error('Error generating summary:', err);
    return 'Error generating summary. Please try again.';
  }
}

/**
 * Generate a pre-visit summary for a specific specialist
 */
export async function generatePreVisitSummary(
  healthState: any,
  specialistType: string
): Promise<string> {
  if (!modelLoaded) {
    await loadModel();
  }

  const prompt = buildPreVisitPrompt(healthState, specialistType);
  const fullPrompt = `<start_of_turn>user\n${prompt}<end_of_turn>\n<start_of_turn>model\n`;

  try {
    const output = await generator(fullPrompt, {
      max_new_tokens: 200,
      temperature: 0.3,
      do_sample: true,
      top_k: 20,
      top_p: 0.9,
    });

    const generatedText = output[0]?.generated_text || '';
    const response = generatedText.replace(fullPrompt, '').trim();
    return response || 'Unable to generate pre-visit summary.';
  } catch (err) {
    console.error('Error generating pre-visit summary:', err);
    return 'Error generating summary. Please try again.';
  }
}

/**
 * Use the LLM to check for medication interactions (alternative to rule-based checker)
 */
export async function checkMedicationInteractionLLM(
  existingMeds: string[],
  newMed: string
): Promise<string> {
  if (!modelLoaded) {
    await loadModel();
  }

  const prompt = `You are a clinical pharmacist. Assess potential interactions between medications.\n\n` +
    `Current medications: ${existingMeds.join(', ')}\n` +
    `New medication to add: ${newMed}\n\n` +
    `Provide a brief risk assessment (low/moderate/high) and note any key concerns. If no known interactions, say "No significant interactions expected." Keep response under 3 sentences.`;

  const fullPrompt = `<start_of_turn>user\n${prompt}<end_of_turn>\n<start_of_turn>model\n`;

  try {
    const output = await generator(fullPrompt, {
      max_new_tokens: 150,
      temperature: 0.2,
      do_sample: true,
      top_k: 10,
      top_p: 0.9,
    });

    const generatedText = output[0]?.generated_text || '';
    const response = generatedText.replace(fullPrompt, '').trim();
    return response || 'Unable to assess interaction.';
  } catch (err) {
    console.error('Error checking interaction:', err);
    return 'Error assessing interaction. Please consult a pharmacist.';
  }
}

/**
 * Ask a general medical question grounded in the patient's history
 */
export async function askMedicalQuestion(
  healthState: any,
  question: string
): Promise<string> {
  if (!modelLoaded) {
    await loadModel();
  }

  const { conditions, medications, allergies } = healthState;

  const context = `Patient conditions: ${conditions.map((c: any) => c.name).join(', ') || 'None'}. ` +
    `Medications: ${medications.map((m: any) => m.name).join(', ') || 'None'}. ` +
    `Allergies: ${allergies.map((a: any) => a.substance).join(', ') || 'None'}.`;

  const prompt = `Based on the following patient health information:\n${context}\n\nAnswer this question: ${question}\n\nProvide a brief, cautious answer advising consultation with a healthcare provider when appropriate.`;

  const fullPrompt = `<start_of_turn>user\n${prompt}<end_of_turn>\n<start_of_turn>model\n`;

  try {
    const output = await generator(fullPrompt, {
      max_new_tokens: 300,
      temperature: 0.3,
      do_sample: true,
      top_k: 20,
      top_p: 0.9,
    });

    const generatedText = output[0]?.generated_text || '';
    const response = generatedText.replace(fullPrompt, '').trim();
    return response || 'Unable to answer question.';
  } catch (err) {
    console.error('Error answering question:', err);
    return 'Error generating answer. Please try again.';
  }
}
