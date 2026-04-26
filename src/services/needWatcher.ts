import { storeNeed, getNeeds as getIDBNeeds, removeNeed as removeIDBNeed } from '../lib/idb';

export async function registerNeed(text: string) {
  const need = {
    text,
    timestamp: Date.now(),
    active: true
  };
  await storeNeed(need);
  return need;
}

export async function getSavedNeeds() {
  const needs = await getIDBNeeds();
  // Sort by timestamp descending
  return needs.sort((a, b) => b.timestamp - a.timestamp);
}

export async function removeNeed(timestamp: number) {
  await removeIDBNeed(timestamp);
}

import { searchCare } from './aiSearch';

export async function checkForAlerts() {
  const needs = await getSavedNeeds();
  const activeNeeds = needs.filter(n => n.active);
  
  if (activeNeeds.length === 0) return [];
  
  const allResults = await Promise.all(
    activeNeeds.map(need => searchCare(need.text))
  );
  
  // Flatten and remove duplicates by ID
  const uniqueResults = new Map();
  allResults.flat().forEach(facility => {
    if (!uniqueResults.has(facility.id)) {
      uniqueResults.set(facility.id, facility);
    }
  });
  
  return Array.from(uniqueResults.values());
}
