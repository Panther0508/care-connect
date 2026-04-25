// LocalStorage-backed registry of care needs being "watched" for the user.
// Storage key is fixed per spec.

const STORAGE_KEY = "caresentinel_needs";

export interface RegisteredNeed {
  id: string;
  text: string;
  createdAt: string; // ISO
}

export function getNeeds(): RegisteredNeed[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RegisteredNeed[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addNeed(text: string): RegisteredNeed {
  const need: RegisteredNeed = {
    id: `need-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  const all = [need, ...getNeeds()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return need;
}

export function removeNeed(id: string): RegisteredNeed[] {
  const next = getNeeds().filter((n) => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
