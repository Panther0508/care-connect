export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("caresentinel", 3); // Incremented to version 3 for health graph

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains("facilities")) {
        db.createObjectStore("facilities", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("vectors")) {
        db.createObjectStore("vectors", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("needs")) {
        db.createObjectStore("needs", { keyPath: "timestamp" });
      }
      // New stores for mesh protocol
      if (!db.objectStoreNames.contains("searchLogs")) {
        db.createObjectStore("searchLogs", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("meshState")) {
        db.createObjectStore("meshState", { keyPath: "key" }); // We'll store the CRDT state under key 'crdt'
      }
      // Health graph and medication data stores (v3)
      if (!db.objectStoreNames.contains("healthGraph")) {
        db.createObjectStore("healthGraph", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("rxnorm")) {
        db.createObjectStore("rxnorm", { keyPath: "drugName" });
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

export async function loadHealthGraph(): Promise<HealthGraphRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('healthGraph', 'readonly');
    const store = transaction.objectStore('healthGraph');
    const request = store.get('latest');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
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
    const transaction = db.transaction('rxnorm', 'readonly');
    const store = transaction.objectStore('rxnorm');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
