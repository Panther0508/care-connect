// src/lib/crdtHealthGraph.ts
// CRDT-based health record manager using Automerge v2.2+

import * as automerge from '@automerge/automerge/slim';

export interface Condition {
  id: string;
  name: string;
  diagnosedDate: string;
  notes: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  startDate: string;
  endDate?: string;
}

export interface Allergy {
  id: string;
  substance: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface Encounter {
  id: string;
  date: string;
  facilityName: string;
  reason: string;
  notes?: string;
}

export type HealthDoc = {
  conditions: Condition[];
  medications: Medication[];
  allergies: Allergy[];
  encounters: Encounter[];
};

/**
 * Create a new empty health document
 */
export function createHealthDoc(): HealthDoc {
  return automerge.emptyDoc<HealthDoc>();
}

/**
 * Add a condition to the health document
 */
export function addCondition(
  doc: HealthDoc,
  condition: Omit<Condition, 'id'>
): HealthDoc {
  return automerge.change(doc, (d) => {
    const newCondition: Condition = {
      ...condition,
      id: generateId(),
    };
    if (!d.conditions) d.conditions = [];
    d.conditions.push(newCondition);
  });
}

/**
 * Add a medication to the health document
 */
export function addMedication(
  doc: HealthDoc,
  medication: Omit<Medication, 'id'>
): HealthDoc {
  return automerge.change(doc, (d) => {
    const newMedication: Medication = {
      ...medication,
      id: generateId(),
    };
    if (!d.medications) d.medications = [];
    d.medications.push(newMedication);
  });
}

/**
 * Add an allergy to the health document
 */
export function addAllergy(
  doc: HealthDoc,
  allergy: Omit<Allergy, 'id'>
): HealthDoc {
  return automerge.change(doc, (d) => {
    const newAllergy: Allergy = {
      ...allergy,
      id: generateId(),
    };
    if (!d.allergies) d.allergies = [];
    d.allergies.push(newAllergy);
  });
}

/**
 * Add an encounter to the health document
 */
export function addEncounter(
  doc: HealthDoc,
  encounter: Omit<Encounter, 'id'>
): HealthDoc {
  return automerge.change(doc, (d) => {
    const newEncounter: Encounter = {
      ...encounter,
      id: generateId(),
    };
    if (!d.encounters) d.encounters = [];
    d.encounters.push(newEncounter);
  });
}

/**
 * Update an existing condition
 */
export function updateCondition(
  doc: HealthDoc,
  id: string,
  updates: Partial<Condition>
): HealthDoc {
  return automerge.change(doc, (d) => {
    const condition = d.conditions?.find((c) => c.id === id);
    if (condition) {
      Object.assign(condition, updates);
    }
  });
}

/**
 * Update an existing medication
 */
export function updateMedication(
  doc: HealthDoc,
  id: string,
  updates: Partial<Medication>
): HealthDoc {
  return automerge.change(doc, (d) => {
    const medication = d.medications?.find((m) => m.id === id);
    if (medication) {
      Object.assign(medication, updates);
    }
  });
}

/**
 * Delete a condition by ID
 */
export function deleteCondition(doc: HealthDoc, id: string): HealthDoc {
  return automerge.change(doc, (d) => {
    d.conditions = d.conditions?.filter((c) => c.id !== id) || [];
  });
}

/**
 * Delete a medication by ID
 */
export function deleteMedication(doc: HealthDoc, id: string): HealthDoc {
  return automerge.change(doc, (d) => {
    d.medications = d.medications?.filter((m) => m.id !== id) || [];
  });
}

/**
 * Delete an allergy by ID
 */
export function deleteAllergy(doc: HealthDoc, id: string): HealthDoc {
  return automerge.change(doc, (d) => {
    d.allergies = d.allergies?.filter((a) => a.id !== id) || [];
  });
}

/**
 * Delete an encounter by ID
 */
export function deleteEncounter(doc: HealthDoc, id: string): HealthDoc {
  return automerge.change(doc, (d) => {
    d.encounters = d.encounters?.filter((e) => e.id !== id) || [];
  });
}

/**
 * Merge two health documents (for CRDT sync)
 */
export function mergeDocs(localDoc: HealthDoc, remoteDoc: HealthDoc): HealthDoc {
  return automerge.merge(localDoc, remoteDoc);
}

/**
 * Serialize a health document to Uint8Array for storage
 */
export function serializeDoc(doc: HealthDoc): Uint8Array {
  return automerge.save(doc);
}

/**
 * Deserialize a health document from Uint8Array
 */
export function deserializeDoc(buffer: Uint8Array): HealthDoc {
  return automerge.load<HealthDoc>(buffer);
}

/**
 * Get a plain JavaScript summary of the current health state
 */
export function getSummary(doc: HealthDoc) {
  return {
    conditions: doc.conditions || [],
    medications: doc.medications || [],
    allergies: doc.allergies || [],
    encounters: doc.encounters || [],
  };
}

/**
 * Generate a unique ID for health record entries
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
