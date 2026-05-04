export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("vitachain", 10); // Bumped to v10 for new referral + contact stores

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Core stores (v1-v3)
      if (!db.objectStoreNames.contains("facilities")) {
        db.createObjectStore("facilities", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("vectors")) {
        db.createObjectStore("vectors", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("needs")) {
        db.createObjectStore("needs", { keyPath: "timestamp" });
      }
      if (!db.objectStoreNames.contains("healthGraph")) {
        db.createObjectStore("healthGraph", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("rxnorm")) {
        db.createObjectStore("rxnorm", { keyPath: "drugName" });
      }

      // Mesh & search (v4)
      if (!db.objectStoreNames.contains("searchLogs")) {
        db.createObjectStore("searchLogs", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("meshState")) {
        db.createObjectStore("meshState", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("passportShares")) {
        db.createObjectStore("passportShares", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("passportScans")) {
        db.createObjectStore("passportScans", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("realtimeCache")) {
        db.createObjectStore("realtimeCache", { keyPath: "key" });
      }

      // Wellness & data (v5)
      if (!db.objectStoreNames.contains("datasetVectors")) {
        db.createObjectStore("datasetVectors", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("medicationReminders")) {
        db.createObjectStore("medicationReminders", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("appointments")) {
        db.createObjectStore("appointments", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("translationCache")) {
        db.createObjectStore("translationCache", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("userProfile")) {
        db.createObjectStore("userProfile", { keyPath: "userId" });
      }

      // AI cache (v6-v7)
      if (!db.objectStoreNames.contains("gemmaCache")) {
        db.createObjectStore("gemmaCache", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("searchCache")) {
        db.createObjectStore("searchCache", { keyPath: "query" });
      }

      // ==================== v8: Full store set ====================

      // Food & exercise databases
      if (!db.objectStoreNames.contains("foodDatabase")) {
        db.createObjectStore("foodDatabase", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("exerciseDatabase")) {
        db.createObjectStore("exerciseDatabase", { keyPath: "id" });
      }

      // Wellness logs
      if (!db.objectStoreNames.contains("foodLogs")) {
        db.createObjectStore("foodLogs", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("workoutLogs")) {
        db.createObjectStore("workoutLogs", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("cycleData")) {
        db.createObjectStore("cycleData", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("dailyHydration")) {
        db.createObjectStore("dailyHydration", { keyPath: "date" });
      }
      if (!db.objectStoreNames.contains("sleepLogs")) {
        db.createObjectStore("sleepLogs", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("medicationLogs")) {
        db.createObjectStore("medicationLogs", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("medicationFeedback")) {
        db.createObjectStore("medicationFeedback", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("mentalHealthLogs")) {
        db.createObjectStore("mentalHealthLogs", { keyPath: "id", autoIncrement: true });
      }

       // Health tracking stores
       if (!db.objectStoreNames.contains("documents")) {
         db.createObjectStore("documents", { keyPath: "id" });
       }
       if (!db.objectStoreNames.contains("healthGoals")) {
         db.createObjectStore("healthGoals", { keyPath: "id" });
       }
       if (!db.objectStoreNames.contains("dependents")) {
         db.createObjectStore("dependents", { keyPath: "id" });
       }
       if (!db.objectStoreNames.contains("smokingCessation")) {
         db.createObjectStore("smokingCessation", { keyPath: "quitDate" });
       }
       if (!db.objectStoreNames.contains("alcoholLog")) {
         db.createObjectStore("alcoholLog", { keyPath: "date" });
       }
       if (!db.objectStoreNames.contains("symptomDiary")) {
         db.createObjectStore("symptomDiary", { keyPath: "id" });
       }
       if (!db.objectStoreNames.contains("painTracker")) {
         db.createObjectStore("painTracker", { keyPath: "id" });
       }
       if (!db.objectStoreNames.contains("moodTracker")) {
         db.createObjectStore("moodTracker", { keyPath: "id" });
       }
       if (!db.objectStoreNames.contains("glucoseLog")) {
         db.createObjectStore("glucoseLog", { keyPath: "id" });
       }
       if (!db.objectStoreNames.contains("bloodPressureLog")) {
         db.createObjectStore("bloodPressureLog", { keyPath: "id" });
       }
       if (!db.objectStoreNames.contains("peakFlowLog")) {
         db.createObjectStore("peakFlowLog", { keyPath: "id" });
       }
       if (!db.objectStoreNames.contains("pelvicDiary")) {
         db.createObjectStore("pelvicDiary", { keyPath: "id" });
       }
       if (!db.objectStoreNames.contains("weightTracker")) {
         db.createObjectStore("weightTracker", { keyPath: "id" });
       }
       if (!db.objectStoreNames.contains("progressPhotos")) {
         db.createObjectStore("progressPhotos", { keyPath: "id" });
       }
// Care Plans stores
        if (!db.objectStoreNames.contains("carePlans")) {
          db.createObjectStore("carePlans", { keyPath: "conditionId" });
        }
        if (!db.objectStoreNames.contains("carePlanLogs")) {
          db.createObjectStore("carePlanLogs", { keyPath: "id", autoIncrement: true });
        }
        // Anatomy Explorer stores
        if (!db.objectStoreNames.contains("anatomy")) {
          db.createObjectStore("anatomy", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("anatomyCache")) {
          db.createObjectStore("anatomyCache", { keyPath: "organId" });
        }

       // AI & RAG stores
      if (!db.objectStoreNames.contains("ragVectors")) {
        db.createObjectStore("ragVectors", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("trainingPairs")) {
        db.createObjectStore("trainingPairs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("evaluationLogs")) {
        db.createObjectStore("evaluationLogs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("chatHistory")) {
        db.createObjectStore("chatHistory", { keyPath: "id", autoIncrement: true });
      }

      // Engagement stores
      if (!db.objectStoreNames.contains("rewardsData")) {
        db.createObjectStore("rewardsData", { keyPath: "userId" });
      }
      if (!db.objectStoreNames.contains("avatarAccessories")) {
        db.createObjectStore("avatarAccessories", { keyPath: "userId" });
      }
      if (!db.objectStoreNames.contains("savedLiterature")) {
        db.createObjectStore("savedLiterature", { keyPath: "pmid" });
      }
      if (!db.objectStoreNames.contains("communityPosts")) {
        db.createObjectStore("communityPosts", { keyPath: "postId" });
      }
      if (!db.objectStoreNames.contains("communityComments")) {
        db.createObjectStore("communityComments", { keyPath: "commentId" });
      }
      if (!db.objectStoreNames.contains("questProgress")) {
        db.createObjectStore("questProgress", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("milestones")) {
        db.createObjectStore("milestones", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("referralData")) {
        db.createObjectStore("referralData", { keyPath: "userId" });
      }
      if (!db.objectStoreNames.contains("referrals")) {
        db.createObjectStore("referrals", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("contactSubmissions")) {
        db.createObjectStore("contactSubmissions", { keyPath: "id", autoIncrement: true });
      }
    };


    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function storeFacilities(facilities: any[]) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("facilities", "readwrite");
    const store = transaction.objectStore("facilities");
    facilities.forEach(fac => store.put(fac));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getFacility(id: string): Promise<any> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("facilities", "readonly");
    const store = transaction.objectStore("facilities");
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllFacilities(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("facilities", "readonly");
    const store = transaction.objectStore("facilities");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeVectors(vectors: {id: string, vector: number[]}[]) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("vectors", "readwrite");
    const store = transaction.objectStore("vectors");
    vectors.forEach(v => store.put(v));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getVector(id: string): Promise<{id: string, vector: number[]} | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("vectors", "readonly");
    const store = transaction.objectStore("vectors");
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllVectors(): Promise<{id: string, vector: number[]}[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("vectors", "readonly");
    const store = transaction.objectStore("vectors");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeNeed(need: {text: string, timestamp: number, active: boolean}) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("needs", "readwrite");
    const store = transaction.objectStore("needs");
    store.put(need);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getNeeds(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("needs", "readonly");
    const store = transaction.objectStore("needs");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeNeed(timestamp: number) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("needs", "readwrite");
    const store = transaction.objectStore("needs");
    store.delete(timestamp);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// New functions for searchLogs
export async function storeSearchLog(log: {term: string, timestamp: string, location?: {lat: number, lng: number}}) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("searchLogs", "readwrite");
    const store = transaction.objectStore("searchLogs");
    store.add(log);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getAllSearchLogs(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("searchLogs", "readonly");
    const store = transaction.objectStore("searchLogs");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// New functions for meshState
export async function storeMeshState(key: string, state: any) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("meshState", "readwrite");
    const store = transaction.objectStore("meshState");
    store.put({key, state});
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getMeshState(key: string): Promise<any> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("meshState", "readonly");
    const store = transaction.objectStore("meshState");
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.state);
    request.onerror = () => reject(request.error);
  });
}
// ==================== Health Graph Storage (new) ====================

export interface HealthGraphRecord {
  key: string;
  encryptedBlob: ArrayBuffer;
  iv: Uint8Array;
  lastModified: string;
  salt: Uint8Array;
}

export async function loadHealthGraph(key: string = 'latest'): Promise<HealthGraphRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('healthGraph', 'readonly');
    const store = transaction.objectStore('healthGraph');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveHealthGraph(record: HealthGraphRecord): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('healthGraph', 'readwrite');
    const store = transaction.objectStore('healthGraph');
    store.put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ==================== Simple scanned health data storage (for clinician view) ====================

export async function getHealthData(): Promise<{ conditions: any[]; medications: any[]; allergies: any[] }> {
  const defaultData = { conditions: [], medications: [], allergies: [] };
  try {
    const stored = await getItem('scannedHealthData');
    return stored || defaultData;
  } catch (err) {
    console.error('Failed to get health data:', err);
    return defaultData;
  }
}

export async function storeHealthData(data: { conditions: any[]; medications: any[]; allergies: any[] }): Promise<void> {
  try {
    await setItem('scannedHealthData', data);
  } catch (err) {
    console.error('Failed to store health data:', err);
    throw err;
  }
}

// ==================== RxNorm Storage (new) ====================

export interface RxNormInteraction {
  drugA: string;
  drugB: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
}

export interface RxNormRecord {
  drugName: string;
  interactions: RxNormInteraction[];
}

export async function saveRxNorm(record: RxNormRecord): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('rxnorm', 'readwrite');
    const store = transaction.objectStore('rxnorm');
    store.put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function loadRxNorm(drugName: string): Promise<RxNormRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('rxnorm', 'readonly');
    const store = transaction.objectStore('rxnorm');
    const request = store.get(drugName.toLowerCase());
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllRxNorm(): Promise<RxNormRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("rxnorm", "readonly");
    const store = transaction.objectStore("rxnorm");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==================== Generic KV Store ====================

export interface KVRecord {
  key: string;
  value: any;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("kv", "readwrite");
    const store = transaction.objectStore("kv");
    store.put({ key, value });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getItem<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise<T | null>((resolve, reject) => {
    const transaction = db.transaction("kv", "readonly");
    const store = transaction.objectStore("kv");
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result as KVRecord | undefined;
      resolve(result?.value ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function removeItem(key: string): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("kv", "readwrite");
    const store = transaction.objectStore("kv");
    store.delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ==================== Real-time Cache with TTL ====================

export interface RealtimeCacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttlMs: number;
}

export async function storeRealtimeCache(key: string, data: any, ttlMs: number): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("realtimeCache", "readwrite");
    const store = transaction.objectStore("realtimeCache");
    store.put({ key, data, timestamp: Date.now(), ttlMs });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getRealtimeCache(key: string): Promise<RealtimeCacheEntry | null> {
  const db = await openDB();
  return new Promise<RealtimeCacheEntry | null>((resolve, reject) => {
    const transaction = db.transaction("realtimeCache", "readonly");
    const store = transaction.objectStore("realtimeCache");
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearRealtimeCache(): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("realtimeCache", "readwrite");
    const store = transaction.objectStore("realtimeCache");
    store.clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function cleanupExpiredCache(): Promise<number> {
  const db = await openDB();
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction("realtimeCache", "readwrite");
    const store = transaction.objectStore("realtimeCache");
    let deletedCount = 0;
    
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const entry = cursor.value as RealtimeCacheEntry;
        const now = Date.now();
        if (now - entry.timestamp > entry.ttlMs) {
          cursor.delete();
          deletedCount++;
        }
        cursor.continue();
      } else {
        resolve(deletedCount);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== Passport Shares & Scans ====================

export interface PassportShare {
  id?: number;
  userId: string;
  specialistType: string;
  credential: any;
  qrDataUrl?: string;
  timestamp: string;
}

export interface PassportScan {
  id?: number;
  clinicianId: string;
  patientDid: string;
  summary?: string;
  specialistType?: string;
  timestamp: string;
}

export async function addPassportShare(share: Omit<PassportShare, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("passportShares", "readwrite");
    const store = transaction.objectStore("passportShares");
    const request = store.add(share);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getPassportShares(userId: string): Promise<PassportShare[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("passportShares", "readonly");
    const store = transaction.objectStore("passportShares");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as PassportShare[];
      const userShares = all.filter(s => s.userId === userId);
      resolve(userShares);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function addPassportScan(scan: Omit<PassportScan, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("passportScans", "readwrite");
    const store = transaction.objectStore("passportScans");
    const request = store.add(scan);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getPassportScans(clinicianId: string): Promise<PassportScan[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("passportScans", "readonly");
    const store = transaction.objectStore("passportScans");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as PassportScan[];
      const clinicianScans = all.filter(s => s.clinicianId === clinicianId);
      resolve(clinicianScans);
    };
    request.onerror = () => reject(request.error);
  });
}


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


// ==================== Food Logs ====================

export interface FoodLog {
  id?: number;
  userId: string;
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodId: string;
  foodName: string;
  servingSize: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  timestamp: number;
}

export async function addFoodLog(log: Omit<FoodLog, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("foodLogs", "readwrite");
    const store = transaction.objectStore("foodLogs");
    const request = store.add(log);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getFoodLogsForDate(userId: string, date: string): Promise<FoodLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("foodLogs", "readonly");
    const store = transaction.objectStore("foodLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as FoodLog[];
      const dayLogs = all.filter(l => l.userId === userId && l.date === date);
      resolve(dayLogs);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getFoodLogsForRange(userId: string, startDate: string, endDate: string): Promise<FoodLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("foodLogs", "readonly");
    const store = transaction.objectStore("foodLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as FoodLog[];
      const rangeLogs = all.filter(l => 
        l.userId === userId && l.date >= startDate && l.date <= endDate
      );
      resolve(rangeLogs);
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== Workout Logs ====================

export interface WorkoutLog {
  id?: number;
  userId: string;
  date: string;
  workoutName: string;
  totalDuration: number;
  totalVolume: number;
  exercises: Array<{
    name: string;
    sets: Array<{ reps: number; weight: number }>;
  }>;
  notes: string;
  timestamp: number;
}

export async function addWorkoutLog(log: Omit<WorkoutLog, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("workoutLogs", "readwrite");
    const store = transaction.objectStore("workoutLogs");
    const request = store.add(log);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getWorkoutLogsForUser(userId: string, limit: number = 10): Promise<WorkoutLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("workoutLogs", "readonly");
    const store = transaction.objectStore("workoutLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as WorkoutLog[];
      const userLogs = all.filter(l => l.userId === userId);
      userLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(userLogs.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== Cycle Data ====================

export interface CycleEntry {
  id?: number;
  userId: string;
  date: string;
  cycleDay: number;
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  symptoms: string[];
  mood: string;
  notes: string;
  timestamp: number;
}

export async function addCycleEntry(entry: Omit<CycleEntry, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("cycleData", "readwrite");
    const store = transaction.objectStore("cycleData");
    const request = store.add(entry);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getCycleData(userId: string, limit: number = 12): Promise<CycleEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("cycleData", "readonly");
    const store = transaction.objectStore("cycleData");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as CycleEntry[];
      const userEntries = all.filter(e => e.userId === userId);
      userEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(userEntries.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== Daily Hydration ====================

export interface DailyHydration {
  date: string;
  userId: string;
  totalMl: number;
  goalMl: number;
  timestamp: number;
}

export async function updateDailyHydration(entry: DailyHydration): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("dailyHydration", "readwrite");
    const store = transaction.objectStore("dailyHydration");
    store.put(entry);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getDailyHydration(userId: string, date: string): Promise<DailyHydration | null> {
  const db = await openDB();
  const key = userId + "_" + date;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("dailyHydration", "readonly");
    const store = transaction.objectStore("dailyHydration");
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// ==================== Sleep Logs ====================

export interface SleepLog {
  id?: number;
  userId: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  totalSleep: number; // minutes
  quality: 1 | 2 | 3 | 4 | 5;
  notes: string;
  timestamp: number;
}

export async function addSleepLog(log: Omit<SleepLog, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("sleepLogs", "readwrite");
    const store = transaction.objectStore("sleepLogs");
    const request = store.add(log);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getSleepLogsForUser(userId: string, limit: number = 10): Promise<SleepLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("sleepLogs", "readonly");
    const store = transaction.objectStore("sleepLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as SleepLog[];
      const userLogs = all.filter(l => l.userId === userId);
      userLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(userLogs.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== Medication Logs ====================

export interface MedicationLog {
  id?: number;
  userId: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  timestamp: number;
  taken: boolean;
  notes?: string;
}

export async function addMedicationLog(log: Omit<MedicationLog, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("medicationLogs", "readwrite");
    const store = transaction.objectStore("medicationLogs");
    const request = store.add(log);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getMedicationLogsForDate(userId: string, date: string): Promise<MedicationLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("medicationLogs", "readonly");
    const store = transaction.objectStore("medicationLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as MedicationLog[];
      const dayLogs = all.filter(l => l.userId === userId && new Date(l.timestamp).toISOString().split('T')[0] === date);
      resolve(dayLogs);
    };
    request.onerror = () => reject(request.error);
  });
}

// Alias for backward compatibility
export async function getWorkoutLogs(userId: string, limit: number = 10): Promise<WorkoutLog[]> {
  return getWorkoutLogsForUser(userId, limit);
}

// Alias for CycleTracker
export async function getCycleLogs(userId: string, limit: number = 12): Promise<CycleEntry[]> {
  return getCycleData(userId, limit);
}

// Aliases for CycleTracker (different naming)
export async function addCycleLog(entry: Omit<CycleEntry, 'id'>): Promise<number> {
  return addCycleEntry(entry);
}

// Aliases for Hydration (different naming)
export async function getHydration(userId: string, date: string): Promise<HydrationLog | null> {
  return getDailyHydration(userId, date);
}

export async function setHydration(entry: HydrationLog): Promise<void> {
  return updateDailyHydration(entry);
}

// Aliases for Sleep (different naming)
export async function getSleepLogs(userId: string, limit: number = 10): Promise<SleepLog[]> {
  return getSleepLogsForUser(userId, limit);
}

// Aliases for Medications (different naming)
export async function getMedicationLogs(userId: string): Promise<MedicationLog[]> {
  return getMedicationLogsForDate(userId, new Date().toISOString().split('T')[0]);
}
  
// Mental Health Logs 

// ==================== Mental Health Logs ====================

export interface MentalHealthLog {
  id?: number;
  userId: string;
  type: 'phq9' | 'gad7';
  score: number;
  interpretation: string;
  responses: Record<string, number>;
  timestamp: number;
  date: string;
}

export async function storeMentalHealthLog(log: Omit<MentalHealthLog, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('mentalHealthLogs')) {
      resolve(-1);
      return;
    }
    const transaction = db.transaction('mentalHealthLogs', 'readwrite');
    const store = transaction.objectStore('mentalHealthLogs');
    const request = store.add(log);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getMentalHealthLogs(userId: string, limit: number = 10): Promise<MentalHealthLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('mentalHealthLogs')) {
      resolve([]);
      return;
    }
    const transaction = db.transaction('mentalHealthLogs', 'readonly');
    const store = transaction.objectStore('mentalHealthLogs');
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as MentalHealthLog[];
      const userLogs = all.filter(l => l.userId === userId);
      userLogs.sort((a, b) => b.timestamp - a.timestamp);
      resolve(userLogs.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}

// Alias
export async function getDB(): Promise<IDBDatabase> {
  return openDB();
}

// ==================== Search Cache (for webSearchService) ====================

export interface SearchCacheEntry {
  query: string;
  results: Array<{ title: string; url: string; snippet: string; source: string }>;
  timestamp: number;
}

export async function getSearchCache(query: string): Promise<SearchCacheEntry | null> {
  const db = await openDB();
  return new Promise<SearchCacheEntry | null>((resolve, reject) => {
    const transaction = db.transaction("searchCache", "readonly");
    const store = transaction.objectStore("searchCache");
    const request = store.get(query);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function setSearchCache(entry: SearchCacheEntry): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("searchCache", "readwrite");
    const store = transaction.objectStore("searchCache");
    store.put(entry);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteStaleSearchCache(ttlMs: number = 60 * 60 * 1000): Promise<number> {
  const db = await openDB();
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction("searchCache", "readwrite");
    const store = transaction.objectStore("searchCache");
    let deleted = 0;
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const entry = cursor.value as SearchCacheEntry;
        if (Date.now() - entry.timestamp > ttlMs) {
          cursor.delete();
          deleted++;
        }
        cursor.continue();
      } else {
        resolve(deleted);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Medication reminder logs
export async function storeMedicationEvent(event: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("medicationLogs", "readwrite");
    const store = transaction.objectStore("medicationLogs");
    const request = store.add(event);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMedicationEvents(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("medicationLogs", "readonly");
    const store = transaction.objectStore("medicationLogs");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getMedicationSummary(): Promise<any> {
  const events = await getMedicationEvents();
  return { totalEvents: events.length };
}

// ==================== Chat History Storage ====================

export interface ChatEntry {
  id?: number;
  createdAt: number;
  title: string;
  preview: string;
  messages?: Array<{ role: string; content: string; timestamp?: number }>;
}

export async function storeChatEntry(entry: Omit<ChatEntry, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction("chatHistory", "readwrite");
    const store = transaction.objectStore("chatHistory");
    const request = store.add(entry);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllChatHistory(): Promise<ChatEntry[]> {
  const db = await openDB();
  return new Promise<ChatEntry[]>((resolve, reject) => {
    const transaction = db.transaction("chatHistory", "readonly");
    const store = transaction.objectStore("chatHistory");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as ChatEntry[];
      // Sort by newest first
      all.sort((a, b) => b.createdAt - a.createdAt);
      resolve(all);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function updateChatEntry(id: number, updates: Partial<ChatEntry>): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("chatHistory", "readwrite");
    const store = transaction.objectStore("chatHistory");
    const existing = store.get(id);
    existing.onsuccess = () => {
      const entry = { ...existing.result, ...updates, id };
      store.put(entry);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

// ==================== Referral Storage ====================

export interface Referral {
  id?: number;
  patientName: string;
  specialistType: string;
  reason: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
  clinicianId?: string;
}

export async function storeReferral(referral: Omit<Referral, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction("referrals", "readwrite");
    const store = transaction.objectStore("referrals");
    const request = store.add(referral);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getReferrals(status?: string): Promise<Referral[]> {
  const db = await openDB();
  return new Promise<Referral[]>((resolve, reject) => {
    const transaction = db.transaction("referrals", "readonly");
    const store = transaction.objectStore("referrals");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as Referral[];
      if (status) {
        resolve(all.filter(r => r.status === status));
      } else {
        resolve(all);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function updateReferralStatus(id: number, status: 'pending' | 'completed' | 'cancelled'): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("referrals", "readwrite");
    const store = transaction.objectStore("referrals");
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (existing) {
        store.put({ ...existing, status });
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// ==================== Contact Submissions ====================

export interface ContactSubmission {
  id?: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: number;
}

export async function storeContactSubmission(submission: Omit<ContactSubmission, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction("contactSubmissions", "readwrite");
    const store = transaction.objectStore("contactSubmissions");
    const request = store.add(submission);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

// ==================== Saved Literature ====================

export interface SavedLiterature {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  abstract: string;
  savedAt: number;
}

export async function saveLiterature(article: SavedLiterature): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("savedLiterature", "readwrite");
    const store = transaction.objectStore("savedLiterature");
    store.put(article);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getSavedLiterature(): Promise<SavedLiterature[]> {
  const db = await openDB();
  return new Promise<SavedLiterature[]>((resolve, reject) => {
    const transaction = db.transaction("savedLiterature", "readonly");
    const store = transaction.objectStore("savedLiterature");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as SavedLiterature[]);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSavedLiterature(pmid: string): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("savedLiterature", "readwrite");
    const store = transaction.objectStore("savedLiterature");
    store.delete(pmid);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getAllContactSubmissions(): Promise<ContactSubmission[]> {
  const db = await openDB();
  return new Promise<ContactSubmission[]>((resolve, reject) => {
    const transaction = db.transaction("contactSubmissions", "readonly");
    const store = transaction.objectStore("contactSubmissions");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==================== Care Plans Storage ====================

export interface DailyTask {
  id: string;
  label: string;
  completed: boolean;
}

export interface CarePlan {
  conditionId: string;
  conditionName: string;
  conditionIcon: string;
  createdAt: number;
  dailyTasks: DailyTask[];
  medications: Array<{
    name: string;
    dose: string;
    frequency: string;
    times: string[];
  }>;
  dietRecommendations: Array<{
    foodId: string;
    name: string;
    reason: string;
  }>;
  exercises: Array<{
    id: string;
    name: string;
    description: string;
    instructions: string[];
  }>;
  warningSigns: string[];
  emergencyContact: {
    phone: string;
    hotline: string;
  };
  redFlags: string[];
}

export interface CarePlanLog {
  id?: number;
  userId: string;
  conditionId: string;
  taskId: string;
  date: string;
  completed: boolean;
  timestamp: number;
}

export async function storeCarePlan(plan: CarePlan): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("carePlans", "readwrite");
    const store = transaction.objectStore("carePlans");
    store.put(plan);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCarePlan(conditionId: string): Promise<CarePlan | null> {
  const db = await openDB();
  return new Promise<CarePlan | null>((resolve, reject) => {
    const transaction = db.transaction("carePlans", "readonly");
    const store = transaction.objectStore("carePlans");
    const request = store.get(conditionId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllCarePlans(): Promise<CarePlan[]> {
  const db = await openDB();
  return new Promise<CarePlan[]>((resolve, reject) => {
    const transaction = db.transaction("carePlans", "readonly");
    const store = transaction.objectStore("carePlans");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as CarePlan[]);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCarePlan(conditionId: string): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("carePlans", "readwrite");
    const store = transaction.objectStore("carePlans");
    store.delete(conditionId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Care Plan Logs
export async function logCarePlanTask(log: Omit<CarePlanLog, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction("carePlanLogs", "readwrite");
    const store = transaction.objectStore("carePlanLogs");
    const request = store.add(log);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getCarePlanLogsForDate(userId: string, date: string): Promise<CarePlanLog[]> {
  const db = await openDB();
  return new Promise<CarePlanLog[]>((resolve, reject) => {
    const transaction = db.transaction("carePlanLogs", "readonly");
    const store = transaction.objectStore("carePlanLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as CarePlanLog[];
      const dayLogs = all.filter(l => l.userId === userId && l.date === date);
      resolve(dayLogs);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getCarePlanLogsForRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<CarePlanLog[]> {
  const db = await openDB();
  return new Promise<CarePlanLog[]>((resolve, reject) => {
    const transaction = db.transaction("carePlanLogs", "readonly");
    const store = transaction.objectStore("carePlanLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as CarePlanLog[];
      const rangeLogs = all.filter(l => l.userId === userId && l.date >= startDate && l.date <= endDate);
      resolve(rangeLogs);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getCarePlanStreak(userId: string, conditionId: string): Promise<number> {
  const db = await openDB();
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction("carePlanLogs", "readonly");
    const store = transaction.objectStore("carePlanLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as CarePlanLog[];
      const userLogs = all.filter(l => l.userId === userId && l.conditionId === conditionId);
      // Sort by date descending
      userLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let streak = 0;
      const today = new Date();
      let currentDate = new Date(today);
      
      for (const log of userLogs) {
        const logDate = new Date(log.date);
        const diffDays = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === streak && log.completed) {
          streak++;
        } else if (!log.completed) {
          break;
        } else {
          break;
        }
      }
      resolve(streak);
    };
    request.onerror = () => reject(request.error);
  });
}


