// src/services/clinicianAI.js
// Clinician AI Service — Thin wrapper around aiCoreRouter
// All logic in promptLibrary / aiCoreRouter

import { routeQuery, getQuotaRemaining } from './aiCoreRouter.js';
import { buildStructuredPrompt } from './promptLibrary.js';

const CLINICIAN_SYSTEM_PROMPT = `You are Vita Clinical, a precise, evidence-based clinical decision-support AI.
Use appropriate medical terminology. Always cite reasoning. Flag uncertainty. Include disclaimers.
Powered by VitaChain hybrid AI (Gemma 4 online, TinyLlama offline). Access PubMed, WHO, FDA, ClinicalTrials in real-time.
If self-harm risk detected: <<VITACHAIN_CRISIS_DETECTED>>`;

/**
 * Main clinician query processor
 */
export async function processClinicianQuery(prompt, options = {}) {
  const { context, patientData, structureOutput = false } = options;

  // Build patient summary if provided
  let mainPrompt = prompt;
  if (patientData) {
    const { conditions = [], medications = [], allergies = [] } = patientData;
    mainPrompt = `Patient: ${conditions.join(', ') || 'healthy'}. Meds: ${medications.join(', ') || 'none'}. Allergies: ${allergies.join(', ') || 'none'}.\n\nQuery: ${prompt}`;
  }
  if (context) {
    mainPrompt = `Clinical context:\n${context}\n\n${mainPrompt}`;
  }

  // Structured output if requested (wrap)
  if (structureOutput) {
    mainPrompt += `\n\nIMPORTANT: Format your response using the 4-section clinical template from SYSTEM INSTRUCTIONS.`;
  }

  const { structuredPrompt } = buildStructuredPrompt(
    'clinician',
    mainPrompt,
    {}
  );

  const result = await routeQuery({ structuredPrompt, role: 'clinician', userId: 'clinician', extractedQuery: prompt });

  return {
    success: true,
    text: result.text,
    model: result.model,
    source: result.source,
    evaluation: result.evaluation,
    emotionalState: result.emotionalState,
    timestamp: new Date().toISOString()
  };
}

/**
 * Differential diagnosis generator
 */
export async function generateDifferential(symptoms, options = {}) {
  const { patientAge, patientSex, maxDiagnoses = 5 } = options;
  const taskPrompt = `Generate differential diagnosis for: ${symptoms}
Patient: ${patientAge || 'unknown'} years, ${patientSex || 'unknown'} sex.

Required:
1. Rank top ${maxDiagnoses} diagnoses with likelihood estimates (±15%)
2. Key supporting findings per diagnosis
3. Red flags requiring urgent action
4. Essential workup (labs/imaging per CDC/UpToDate)
5. Citations from guidelines or recent studies`;

  const { structuredPrompt } = buildStructuredPrompt('clinician', taskPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'clinician', extractedQuery: symptoms });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * ICD-10 code suggestion
 */
export async function suggestICD10(conditions, options = {}) {
  const taskPrompt = `Suggest ICD-10 codes for: ${conditions}

For each code provide:
- Primary code (most specific)
- Secondary codes if applicable
- Brief description and coding notes (laterality, severity)`;

  const { structuredPrompt } = buildStructuredPrompt('clinician', taskPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'clinician', extractedQuery: conditions });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * Prescribing assistance
 */
export async function assistPrescribing(drugInfo, options = {}) {
  const { patientConditions = [], patientAllergies = [] } = options;

  const taskPrompt = `Prescribing guidance: ${drugInfo}

Patient conditions: ${patientConditions.join(', ') || 'none'}
Patient allergies: ${patientAllergies.join(', ') || 'none'}

Include:
- Standard dosing (adult & renal adjustment if needed)
- Major drug interactions (check all current meds)
- Contraindications
- Monitoring requirements (labs, follow-up timing)
- Patient counseling points (adherence, side effects, red flags)`;

  const { structuredPrompt } = buildStructuredPrompt('clinician', taskPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'clinician', extractedQuery: drugInfo });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * Referral note generation
 */
export async function generateReferral(reason, specialty, options = {}) {
  const { patientSummary = '', urgency = 'routine' } = options;

  const taskPrompt = `Generate a formal referral letter to ${specialty}.

Reason: ${reason}
Patient summary: ${patientSummary}
Urgency: ${urgency}

Format as professional clinical correspondence:
- Subject line with "URGENT" if needed
- Brief HPI (2–3 sentences)
- Relevant PMH, meds, allergies
- Physical exam findings
- Assessment & specific reason for referral
- Clear questions for specialist`;

  const { structuredPrompt } = buildStructuredPrompt('clinician', taskPrompt);
  const extractedQuery = `Referral to ${specialty}: ${reason}`;
  const result = await routeQuery({ structuredPrompt, role: 'clinician', extractedQuery });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * Clinical note structuring
 */
export async function structureNote(noteType, findings, options = {}) {
  const templates = {
    SOAP: `Subjective: {subjective}\nObjective: {objective}\nAssessment: {assessment}\nPlan: {plan}`,
    Brief: `CC: {cc}\nFindings: {findings}\nPlan: {plan}`,
    Discharge: `Dx: {diagnosis}\nCourse: {course}\nDispo: {disposition}\nFollow-up: {followup}`
  };

  const taskPrompt = `Structure this clinical note as ${noteType}:

Findings: ${findings}

Use this template:
${templates[noteType] || templates.Brief}

Fill every field. Use concise medical terminology appropriate for clinicians.`;

  const { structuredPrompt } = buildStructuredPrompt('clinician', taskPrompt);
  const result = await routeQuery({ structuredPrompt, role: 'clinician', extractedQuery: findings });

  return { success: true, text: result.text, model: result.model, source: result.source, evaluation: result.evaluation };
}

/**
 * Quota status
 */
export function getClinicianQuota() {
  return getQuotaRemaining ? getQuotaRemaining() : Promise.resolve({ used: 0, remaining: 1500, resetAt: new Date().toISOString() });
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
