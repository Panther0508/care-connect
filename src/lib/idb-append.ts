

// ==================== Food Database ====================

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  servingUnit?: string;
  servingSize?: number;
  source: 'african' | 'global';
  region?: string;
  description?: string;
}

export async function storeFoodItems(items: FoodItem[]): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("foodDatabase", "readwrite");
    const store = transaction.objectStore("foodDatabase");
    items.forEach(item => store.put(item));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function searchFoods(query: string): Promise<FoodItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("foodDatabase", "readonly");
    const store = transaction.objectStore("foodDatabase");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as FoodItem[];
      const q = query.toLowerCase();
      const filtered = all.filter(f => f.name?.toLowerCase().includes(q));
      resolve(filtered.slice(0, 20));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAllFoods(): Promise<FoodItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("foodDatabase", "readonly");
    const store = transaction.objectStore("foodDatabase");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as FoodItem[]);
    request.onerror = () => reject(request.error);
  });
}

// ==================== Exercise Database ====================

export interface Exercise {
  id: string;
  name: string;
  category: string;
  instructions: string[];
  musclesPrimary: string[];
  musclesSecondary?: string[];
  equipment?: string;
  videoUrl?: string;
  level?: string;
  force?: string;
  mechanic?: string;
}

export async function storeExercises(exercises: Exercise[]): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("exerciseDatabase", "readwrite");
    const store = transaction.objectStore("exerciseDatabase");
    exercises.forEach(ex => store.put(ex));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("exerciseDatabase", "readonly");
    const store = transaction.objectStore("exerciseDatabase");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as Exercise[]);
    request.onerror = () => reject(request.error);
  });
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("exerciseDatabase", "readonly");
    const store = transaction.objectStore("exerciseDatabase");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as Exercise[];
      const q = query.toLowerCase();
      const filtered = all.filter(e => e.name?.toLowerCase().includes(q));
      resolve(filtered.slice(0, 20));
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== User Profile Storage ====================

export interface UserProfile {
  userId: string;
  displayName: string;
  phone: string;
  gender: 'male' | 'female' | 'non-binary' | 'other' | 'prefer-not-to-say' | '';
  biologicalSex: 'male' | 'female' | '';
  dateOfBirth: string | null;
  height: number | null;
  weight: number | null;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '';
  avatarUrl: string;
  preferredLanguage: string;
  enableCycleTracking: boolean;
  createdAt: number;
  updatedAt: number;
}

export async function storeUserProfile(profile: UserProfile): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("userProfile", "readwrite");
    const store = transaction.objectStore("userProfile");
    store.put(profile);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("userProfile", "readonly");
    const store = transaction.objectStore("userProfile");
    const request = store.get(userId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}
