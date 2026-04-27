// src/services/medicationChecker.ts
// Offline medication interaction checker using RxNorm data

import { loadRxNorm, RxNormRecord, RxNormInteraction } from '../lib/idb';

/**
 * Check interactions between a list of current medications and a new medication
 * Uses locally stored RxNorm data. Returns an array of warning messages.
 */
export async function checkInteractions(
  currentMeds: string[],
  newMed: string
): Promise<string[]> {
  const warnings: string[] = [];

  // Normalize drug names (lowercase, trim)
  const normalizedNewMed = newMed.toLowerCase().trim();

  // Check interactions between new med and each existing med
  for (const existingMed of currentMeds) {
    const normalizedExisting = existingMed.toLowerCase().trim();

    // Check both directions (A-B and B-A)
    const interaction1 = await lookupInteraction(normalizedExisting, normalizedNewMed);
    const interaction2 = await lookupInteraction(normalizedNewMed, normalizedExisting);

    const interaction = interaction1 || interaction2;

    if (interaction) {
      const message = `Interaction between ${existingMed} and ${newMed}: ${interaction.description} (Severity: ${interaction.severity})`;
      warnings.push(message);
    }
  }

  return warnings;
}

/**
 * Look up an interaction between two drugs from local RxNorm store
 */
async function lookupInteraction(
  drugA: string,
  drugB: string
): Promise<RxNormInteraction | null> {
  const record = await loadRxNorm(drugA);
  if (!record || !record.interactions) return null;

  const found = record.interactions.find(
    (i) => i.drugB.toLowerCase() === drugB
  );

  return found || null;
}

/**
 * Load RxNorm data from a JSON file (to be called once on app startup or on demand)
 */
export async function populateRxNormFromJSON(data: RxNormRecord[]): Promise<void> {
  for (const record of data) {
    await saveRxNorm(record);
  }
}

/**
 * Simple in-memory medication checker for demo when RxNorm not available
 * Returns generic warnings based on drug name similarity (basic fallback)
 */
export function checkInteractionsSimple(
  currentMeds: string[],
  newMed: string
): string[] {
  const warnings: string[] = [];

  // List of known high-risk drug classes (demo only)
  const highRiskKeywords = ['warfarin', 'aspirin', 'ibuprofen', 'naproxen'];
  const bloodPressureKeywords = ['lisinopril', 'enalapril', 'losartan'];
  const diabetesKeywords = ['metformin', 'insulin', 'glipizide'];

  const newLower = newMed.toLowerCase();

  // Check for warfarin + antiplatelet/NSAID
  if (highRiskKeywords.includes(newLower)) {
    for (const med of currentMeds) {
      const medLower = med.toLowerCase();
      if (highRiskKeywords.includes(medLower) && medLower !== newLower) {
        warnings.push(`Caution: Combining two blood thinners/NSAIDs (${med} + ${newMed}) may increase bleeding risk.`);
      }
    }
  }

  // Check for duplicate ACE inhibitors
  if (bloodPressureKeywords.includes(newLower)) {
    for (const med of currentMeds) {
      if (bloodPressureKeywords.includes(med.toLowerCase())) {
        warnings.push(`Caution: Two blood pressure medications of similar class (${med} + ${newMed}) may cause hypotension.`);
      }
    }
  }

  // Check for duplicate diabetes meds
  if (diabetesKeywords.includes(newLower)) {
    for (const med of currentMeds) {
      if (diabetesKeywords.includes(med.toLowerCase())) {
        warnings.push(`Caution: Two diabetes medications (${med} + ${newMed}) may cause hypoglycemia.`);
      }
    }
  }

  return warnings;
}

/**
 * Get interaction severity label with color coding
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'major':
      return 'text-red-500';
    case 'moderate':
      return 'text-amber-500';
    case 'minor':
      return 'text-blue-400';
    default:
      return 'text-slate-400';
  }
}
