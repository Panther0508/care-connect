export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("caresentinel", 1);

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
