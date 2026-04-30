// src/services/foodDatabase.ts
// Offline African & global food database service

import { getAllFoods, storeFoodItems, searchFoods } from '../lib/idb';

// Note: In a full TypeScript setup, these would be imported as JSON modules
// For now, we'll fetch them at runtime or embed them
let AFRICAN_FOODS: any[] = [];
let GLOBAL_FOODS: any[] = [];
let isInitialized = false;

/**
 * Initialize the food database: load JSON data into IndexedDB if empty.
 */
export async function initFoodDatabase(): Promise<void> {
  if (isInitialized) return;
  const existing = await getAllFoods();
  if (existing.length > 0) {
    isInitialized = true;
    return;
  }

  // Load African foods
  try {
    const afResponse = await fetch('/data/african-foods.json');
    AFRICAN_FOODS = await afResponse.json();
  } catch (err) {
    console.error('Failed to load African foods:', err);
  }

  // Load global foods
  try {
    const glResponse = await fetch('/data/global-foods.json');
    GLOBAL_FOODS = await glResponse.json();
  } catch (err) {
    console.error('Failed to load global foods:', err);
  }

  const allFoods = [...AFRICAN_FOODS, ...GLOBAL_FOODS];
  if (allFoods.length > 0) {
    await storeFoodItems(allFoods);
  }
  isInitialized = true;
}

export { searchFoods, getAllFoods };
