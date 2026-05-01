// src/services/educationEngine.js
// Education Engine - Health Education Modules
// Uses native IndexedDB

const DB_NAME = 'VitaCareDB';
const DB_VERSION = 2; // bumped to 2 for potential schema updates
const MODULES_STORE = 'educationModules';
const PROGRESS_STORE = 'educationProgress';

let dbInstance = null;

const openDB = async () => {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(MODULES_STORE)) {
        db.createObjectStore(MODULES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
        db.createObjectStore(PROGRESS_STORE, { keyPath: 'id' }); // id = userId_moduleId
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

/**
 * Fetch education modules from the JSON file and store in IndexedDB
 */
export const fetchAndStoreEducationModules = async () => {
  try {
    const response = await fetch('/healthEducation.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch education data: ${response.status}`);
    }
    const modulesData = await response.json();

    const db = await openDB();
    const tx = db.transaction(MODULES_STORE, 'readwrite');
    const store = tx.objectStore(MODULES_STORE);

    await store.clear();
    for (const module of modulesData.modules) {
      await store.add(module);
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return modulesData.modules;
  } catch (error) {
    console.error('Error fetching and storing education modules:', error);
    throw error;
  }
};

/**
 * Get all education modules from IndexedDB
 */
export const getEducationModules = async () => {
  const db = await openDB();
  const tx = db.transaction(MODULES_STORE, 'readonly');
  const store = tx.objectStore(MODULES_STORE);
  const request = store.getAll();

  const modules = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  return modules;
};

/**
 * Get a specific education module by ID
 */
export const getEducationModuleById = async (moduleId) => {
  const db = await openDB();
  const tx = db.transaction(MODULES_STORE, 'readonly');
  const store = tx.objectStore(MODULES_STORE);
  const request = store.get(moduleId);

  const module = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  return module;
};

/**
 * Save user progress for a module
 */
export const saveEducationProgress = async (userId, moduleId, progressData) => {
  const db = await openDB();
  const tx = db.transaction(PROGRESS_STORE, 'readwrite');
  const store = tx.objectStore(PROGRESS_STORE);

  const id = `${userId}_${moduleId}`;
  const getRequest = store.get(id);
  const existing = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  const dataToSave = {
    id,
    userId,
    moduleId,
    ...progressData,
    lastUpdated: new Date().toISOString(),
  };

  await store.put(dataToSave);

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Get user progress for a module
 */
export const getEducationProgress = async (userId, moduleId) => {
  const db = await openDB();
  const tx = db.transaction(PROGRESS_STORE, 'readonly');
  const store = tx.objectStore(PROGRESS_STORE);
  const id = `${userId}_${moduleId}`;
  const request = store.get(id);

  const progress = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  return progress;
};

/**
 * Mark a lesson as completed
 */
export const markLessonCompleted = async (userId, moduleId, lessonId) => {
  const progress = await getEducationProgress(userId, moduleId);
  const completedLessons = progress?.completedLessons || [];
  if (!completedLessons.includes(lessonId)) {
    completedLessons.push(lessonId);
  }

  await saveEducationProgress(userId, moduleId, {
    completedLessons,
    lastAccessed: new Date().toISOString()
  });
};

/**
 * Save quiz score
 */
export const saveQuizScore = async (userId, moduleId, lessonId, score) => {
  const progress = await getEducationProgress(userId, moduleId);
  const quizScores = progress?.quizScores || {};
  quizScores[lessonId] = score;

  await saveEducationProgress(userId, moduleId, {
    quizScores,
    lastAccessed: new Date().toISOString()
  });
};

/**
 * Calculate overall module progress percentage
 */
export const calculateModuleProgress = async (userId, moduleId) => {
  const module = await getEducationModuleById(moduleId);
  if (!module) return 0;

  const progress = await getEducationProgress(userId, moduleId);
  const completed = progress?.completedLessons || [];

  return Math.round((completed.length / module.lessons.length) * 100);
};

export default {
  initEducationDB,
  fetchAndStoreEducationModules,
  getEducationModules,
  getEducationModuleById,
  saveEducationProgress,
  getEducationProgress,
  markLessonCompleted,
  saveQuizScore,
  calculateModuleProgress
};
