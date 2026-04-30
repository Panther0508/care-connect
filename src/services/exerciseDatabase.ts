// src/services/exerciseDatabase.ts
// Offline exercise library from free-exercise-db

import { getAllExercises, storeExercises, searchExercises } from '../lib/idb';

let isInitialized = false;
let cachedExercises: any[] = [];

/**
 * Initialize exercise database from JSON file
 */
export async function initExerciseDatabase(): Promise<void> {
  if (isInitialized) return;
  const existing = await getAllExercises();
  if (existing.length > 0) {
    isInitialized = true;
    cachedExercises = existing;
    return;
  }

  // Load from public data
  try {
    const response = await fetch('/data/exercises.json');
    const exercises = await response.json();
    const transformed = exercises.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      instructions: item.instructions || [],
      musclesPrimary: item.primaryMuscles || [],
      musclesSecondary: item.secondaryMuscles || [],
      equipment: item.equipment || 'Bodyweight',
      level: item.level || 'beginner',
      force: item.force || '',
      mechanic: item.mechanic || undefined
    }));
    await storeExercises(transformed);
    cachedExercises = transformed;
    isInitialized = true;
  } catch (err) {
    console.error('Failed to load exercises:', err);
    isInitialized = true; // Still mark as initialized to avoid retry
  }
}

export { getAllExercises, searchExercises, storeExercises };
