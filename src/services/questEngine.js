// src/services/questEngine.js
// Quest Engine - Gamification quests
// Uses native IndexedDB

const DB_NAME = 'vitachain-quests';
const DB_VERSION = 1;
const QUEST_PROGRESS_STORE = 'questProgress';
const QUEST_HISTORY_STORE = 'questHistory';

let dbInstance = null;

const openDB = async () => {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(QUEST_PROGRESS_STORE)) {
        // Composite key [userId, questId]
        const store = db.createObjectStore(QUEST_PROGRESS_STORE, { keyPath: 'id', autoIncrement: false });
        store.createIndex('userId', 'userId');
      }
      if (!db.objectStoreNames.contains(QUEST_HISTORY_STORE)) {
        db.createObjectStore(QUEST_HISTORY_STORE, { keyPath: 'id', autoIncrement: true });
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

// Quest definitions
export const QUESTS = [
  {
    id: 'hydration_bootcamp',
    title: 'Hydration Bootcamp',
    description: 'Drink 8 glasses daily for 7 days',
    duration: 7,
    requirements: [{ type: 'water_glass', count: 8, per: 'day' }],
    rewardPoints: 150,
    badgeUnlock: 'hydration_hero',
    difficulty: 'easy'
  },
  {
    id: 'sleep_reset',
    title: 'Sleep Reset',
    description: 'Log sleep for 14 consecutive days',
    duration: 14,
    requirements: [{ type: 'sleep_log', count: 1, per: 'day' }],
    rewardPoints: 200,
    badgeUnlock: 'sleep_steward',
    difficulty: 'medium'
  },
  {
    id: 'medication_streak',
    title: 'Medication Streak',
    description: 'Perfect adherence for 30 days',
    duration: 30,
    requirements: [{ type: 'medication_adherence', count: 1, per: 'day' }],
    rewardPoints: 500,
    badgeUnlock: 'medication_master',
    difficulty: 'hard'
  },
  {
    id: 'workout_kickstart',
    title: 'Workout Kickstart',
    description: '10 workouts in 21 days',
    duration: 21,
    requirements: [{ type: 'workout_completed', count: 10 }],
    rewardPoints: 300,
    difficulty: 'medium'
  },
  {
    id: 'nutrition_detective',
    title: 'Nutrition Detective',
    description: 'Log 3 meals daily for 14 days',
    duration: 14,
    requirements: [{ type: 'meal_logged', count: 3, per: 'day' }],
    rewardPoints: 250,
    difficulty: 'medium'
  },
  {
    id: 'mindfulness_journey',
    title: 'Mindfulness Journey',
    description: 'Complete PHQ-9 & GAD-7, discuss with Vita',
    duration: 7,
    requirements: [
      { type: 'assessment_completed', count: 2 },
      { type: 'ai_chat_about_assessment', count: 1 }
    ],
    rewardPoints: 100,
    difficulty: 'easy'
  },
  {
    id: 'passport_pioneer',
    title: 'Passport Pioneer',
    description: 'Share passport 5 times',
    duration: 30,
    requirements: [{ type: 'passport_shared', count: 5 }],
    rewardPoints: 200,
    difficulty: 'easy'
  },
  {
    id: 'community_builder',
    title: 'Community Builder',
    description: 'Create 5 community posts',
    duration: 30,
    requirements: [{ type: 'community_post_created', count: 5 }],
    rewardPoints: 150,
    difficulty: 'medium'
  },
  {
    id: 'wellness_360',
    title: 'Wellness 360',
    description: 'Log meals, workouts, AND sleep for 7 consecutive days',
    duration: 7,
    requirements: [
      { type: 'meal_logged', count: 1, per: 'day' },
      { type: 'workout_completed', count: 1, per: 'day' },
      { type: 'sleep_logged', count: 1, per: 'day' }
    ],
    rewardPoints: 400,
    badgeUnlock: 'wellness_360',
    difficulty: 'hard'
  },
  {
    id: 'first_aid_ready',
    title: 'First Aid Ready',
    description: 'Read 10 first-aid entries',
    duration: 14,
    requirements: [{ type: 'first_aid_read', count: 10 }],
    rewardPoints: 100,
    difficulty: 'easy'
  }
];

// Get active quests for a user
export const getActiveQuests = async (userId) => {
  const db = await openDB();
  const tx = db.transaction(QUEST_PROGRESS_STORE, 'readonly');
  const store = tx.objectStore(QUEST_PROGRESS_STORE);
  const index = store.index('userId');
  const request = index.getAll(userId);

  const progressEntries = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  const activeQuests = [];
  for (const progress of progressEntries) {
    const quest = QUESTS.find(q => q.id === progress.questId);
    if (quest && !progress.completed && !progress.abandoned) {
      activeQuests.push({
        ...quest,
        progress: progress.progress || 0,
        daysRemaining: calculateDaysRemaining(progress.startDate, quest.duration),
        joinedAt: progress.startDate
      });
    }
  }

  return activeQuests;
};

// Get available quests for a user (quests they can join)
export const getAvailableQuests = async (userId) => {
  const db = await openDB();
  const tx = db.transaction(QUEST_PROGRESS_STORE, 'readonly');
  const store = tx.objectStore(QUEST_PROGRESS_STORE);
  const index = store.index('userId');
  const request = index.getAll(userId);

  const progressEntries = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  const interactedQuestIds = new Set(progressEntries.map(p => p.questId));
  return QUESTS.filter(quest => !interactedQuestIds.has(quest.id));
};

// Join a quest
export const joinQuest = async (userId, questId) => {
  const db = await openDB();
  const tx = db.transaction(QUEST_PROGRESS_STORE, 'readwrite');
  const store = tx.objectStore(QUEST_PROGRESS_STORE);
  const id = `${userId}_${questId}`;
  const existingRequest = store.get(id);

  const existing = await new Promise((resolve) => {
    existingRequest.onsuccess = () => resolve(existingRequest.result);
    existingRequest.onerror = () => resolve(null);
  });

  if (existing) {
    if (!existing.completed && !existing.abandoned) {
      await new Promise((resolve) => {
        tx.oncomplete = () => resolve();
      });
      return { success: true, alreadyJoined: true };
    }
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, error: 'Quest already completed or abandoned' };
  }

  const quest = QUESTS.find(q => q.id === questId);
  if (!quest) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, error: 'Quest not found' };
  }

  const progressData = {
    id,
    userId,
    questId,
    progress: 0,
    completed: false,
    abandoned: false,
    startDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  await store.add(progressData);

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return { success: true };
};

// Update quest progress
export const updateQuestProgress = async (userId, questId, progressIncrement) => {
  const db = await openDB();
  const tx = db.transaction(QUEST_PROGRESS_STORE, 'readwrite');
  const store = tx.objectStore(QUEST_PROGRESS_STORE);
  const id = `${userId}_${questId}`;
  const getRequest = store.get(id);

  const progress = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  if (!progress) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, error: 'Quest progress not found' };
  }

  if (progress.completed || progress.abandoned) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, error: 'Quest is already completed or abandoned' };
  }

  const quest = QUESTS.find(q => q.id === questId);
  if (!quest) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, error: 'Quest not found' };
  }

  let newProgress = progress.progress + progressIncrement;
  const maxProgress = 100;

  let requirementsMet = true;
  for (const req of quest.requirements) {
    // Simplified: no per-requirement tracking
  }

  if (newProgress >= maxProgress) {
    newProgress = maxProgress;
    progress.completed = true;

    // Award points (would integrate rewardsEngine)
  }

  progress.progress = newProgress;
  progress.lastUpdated = new Date().toISOString();

  await store.put(progress);

  // Add to history if completed
  if (progress.completed) {
    const historyTx = db.transaction(QUEST_HISTORY_STORE, 'readwrite');
    const historyStore = historyTx.objectStore(QUEST_HISTORY_STORE);
    await historyStore.add({
      userId,
      questId,
      completedAt: new Date().toISOString(),
      rewardPoints: quest.rewardPoints,
      badgeUnlock: quest.badgeUnlock
    });
    await new Promise((resolve) => {
      historyTx.oncomplete = () => resolve();
    });
  }

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return {
    success: true,
    completed: progress.completed,
    progress: newProgress,
    reward: progress.completed ? quest.rewardPoints : 0
  };
};

// Abandon a quest
export const abandonQuest = async (userId, questId) => {
  const db = await openDB();
  const tx = db.transaction(QUEST_PROGRESS_STORE, 'readwrite');
  const store = tx.objectStore(QUEST_PROGRESS_STORE);
  const id = `${userId}_${questId}`;
  const getRequest = store.get(id);

  const progress = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  if (!progress) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, error: 'Quest progress not found' };
  }

  if (progress.completed) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, error: 'Cannot abandon a completed quest' };
  }

  progress.abandoned = true;
  progress.lastUpdated = new Date().toISOString();

  await store.put(progress);

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return { success: true };
};

// Get quest history for a user
export const getQuestHistory = async (userId) => {
  const db = await openDB();
  const tx = db.transaction(QUEST_HISTORY_STORE, 'readonly');
  const store = tx.objectStore(QUEST_HISTORY_STORE);
  const index = store.index('userId');
  const request = index.getAll(userId);

  const historyEntries = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  const enrichedHistory = [];
  for (const entry of historyEntries) {
    const quest = QUESTS.find(q => q.id === entry.questId);
    if (quest) {
      enrichedHistory.push({
        ...entry,
        title: quest.title,
        badgeUnlock: quest.badgeUnlock
      });
    }
  }

  return enrichedHistory;
};

// Helper
function calculateDaysRemaining(startDateString, durationDays) {
  if (!startDateString) return durationDays;
  const startDate = new Date(startDateString);
  const today = new Date();
  const elapsedDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const remainingDays = durationDays - elapsedDays;
  return Math.max(0, remainingDays);
}

export default {
  initQuestDB: openDB,
  QUESTS,
  getActiveQuests,
  getAvailableQuests,
  joinQuest,
  updateQuestProgress,
  abandonQuest,
  getQuestHistory
};
