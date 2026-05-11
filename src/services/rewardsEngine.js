// src/services/rewardsEngine.js
// Rewards Engine - Points, Badges, Streaks
// Uses native IndexedDB

const DB_NAME = 'vitachain-rewards';
const DB_VERSION = 1;
const REWARDS_STORE = 'rewardsData';
const STREAKS_STORE = 'streaksData';
const BADGES_STORE = 'badgesData';

let dbInstance = null;

const openDB = async () => {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(REWARDS_STORE)) {
        db.createObjectStore(REWARDS_STORE, { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains(STREAKS_STORE)) {
        const store = db.createObjectStore(STREAKS_STORE, { keyPath: ['userId', 'type'] });
        store.createIndex('userId', 'userId');
      }
      if (!db.objectStoreNames.contains(BADGES_STORE)) {
        const store = db.createObjectStore(BADGES_STORE, { keyPath: ['userId', 'badgeId'] });
        store.createIndex('userId', 'userId');
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    }// Action constants
export const ACTION_LOGIN_DAILY = 'login_daily';
export const ACTION_COMPLETE_AI_CHAT = 'complete_ai_chat';
export const ACTION_SHARE_PASSPORT = 'share_passport';
export const ACTION_LOG_MEDICATION = 'log_medication';
export const ACTION_COMPLETE_WORKOUT = 'complete_workout';
export const ACTION_LOG_MEAL = 'log_meal';
export const ACTION_COMPLETE_ASSESSMENT = 'complete_assessment';
export const ACTION_REGISTER_NEED = 'register_need';
export const ACTION_CONFIRM_CARE = 'confirm_care';
export const ACTION_MAINTAIN_STREAK_7D = 'maintain_streak_7d';
export const ACTION_MAINTAIN_STREAK_30D = 'maintain_streak_30d';
export const ACTION_REFERRAL_SIGNUP = 'referral_signup';

// Badge definitions
export const BADGES = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete onboarding',
    icon: '👶',
    criteria: (userData) => userData.onboardingCompleted || false,
    tier: 'bronze'
  },
  {
    id: 'health_scribe',
    name: 'Health Scribe',
    description: 'Log 10 health entries',
    icon: '📝',
    criteria: (userData) => (userData.healthEntries || 0) >= 10,
    tier: 'bronze'
  },
  {
    id: 'medication_master',
    name: 'Medication Master',
    description: '30-day medication adherence streak',
    icon: '💊',
    criteria: (userData) => (userData.streaks?.medication?.current || 0) >= 30,
    tier: 'silver'
  },
  {
    id: 'passport_pro',
    name: 'Passport Pro',
    description: 'Share passport 5 times',
    icon: '📤',
    criteria: (userData) => (userData.passportShares || 0) >= 5,
    tier: 'silver'
  },
  {
    id: 'workout_warrior',
    name: 'Workout Warrior',
    description: 'Complete 20 workouts',
    icon: '💪',
    criteria: (userData) => (userData.workoutsCompleted || 0) >= 20,
    tier: 'silver'
  },
  {
    id: 'mindful_soul',
    name: 'Mindful Soul',
    description: 'Complete PHQ-9 & GAD-7 assessments',
    icon: '🧠',
    criteria: (userData) => (userData.assessmentsCompleted || 0) >= 2,
    tier: 'gold'
  },
  {
    id: 'streak_champion',
    name: 'Streak Champion',
    description: '30-day login streak',
    icon: '🔥',
    criteria: (userData) => (userData.streaks?.login?.current || 0) >= 30,
    tier: 'gold'
  },
  {
    id: 'community_guardian',
    name: 'Community Guardian',
    description: 'Register 5 health needs',
    icon: '🛡️',
    criteria: (userData) => (userData.needsRegistered || 0) >= 5,
    tier: 'gold'
  },
  {
    id: 'care_connector',
    name: 'Care Connector',
    description: 'Confirm care received 3 times',
    icon: '🤝',
    criteria: (userData) => (userData.careConfirmations || 0) >= 3,
    tier: 'gold'
  },
  {
    id: 'nutrition_navigator',
    name: 'Nutrition Navigator',
    description: 'Log 50 meals',
    icon: '🥗',
    criteria: (userData) => (userData.mealsLogged || 0) >= 50,
    tier: 'platinum'
  },
  {
    id: 'hydration_hero',
    name: 'Hydration Hero',
    description: 'Meet water goal 30 days',
    icon: '💧',
    criteria: (userData) => (userData.streaks?.water?.current || 0) >= 30,
    tier: 'platinum'
  },
  {
    id: 'sleep_steward',
    name: 'Sleep Steward',
    description: 'Log sleep 30 days',
    icon: '😴',
    criteria: (userData) => (userData.streaks?.sleep?.current || 0) >= 30,
    tier: 'platinum'
  },
  {
    id: 'cycle_sage',
    name: 'Cycle Sage',
    description: 'Track cycle for 3 consecutive months',
    icon: '📅',
    criteria: (userData) => (userData.cycleMonthsTracked || 0) >= 3,
    tier: 'platinum'
  },
  {
    id: 'first_responder',
    name: 'First Responder',
    description: 'Use first-aid library 5 times',
    icon: '🚑',
    criteria: (userData) => (userData.firstAidUsages || 0) >= 5,
    tier: 'platinum'
  },
  {
    id: 'vitachain_advocate',
    name: 'VitaChain Advocate',
    description: 'Refer 3 users',
    icon: '📢',
    criteria: (userData) => (userData.referralsSuccessful || 0) >= 3,
    tier: 'platinum'
  }
];

// Helper: create composite key
const makeKey = (userId, secondary) => [userId, secondary];

/**
 * Award points for an action
 */
export const awardPoints = async (userId, actionType, metadata = {}) => {
  const db = await openDB();

  // Get current user data
  const tx = db.transaction(REWARDS_STORE, 'readwrite');
  const store = tx.objectStore(REWARDS_STORE);
  const getReq = store.get(userId);
  let userData = await new Promise((resolve) => {
    getReq.onsuccess = () => resolve(getReq.result);
    getReq.onerror = () => resolve(null);
  });

  if (!userData) {
    userData = {
      userId,
      points: 0,
      healthEntries: 0,
      workoutsCompleted: 0,
      mealsLogged: 0,
      passportShares: 0,
      assessmentsCompleted: 0,
      needsRegistered: 0,
      careConfirmations: 0,
      referralsSuccessful: 0,
      firstAidUsages: 0,
      onboardingCompleted: false,
      cycleMonthsTracked: 0
    };
  }

  // Update streaks
  await updateStreak(db, userId, actionType);

  // Points per action
  let pointsToAdd = 0;
  switch (actionType) {
    case ACTION_LOGIN_DAILY: pointsToAdd = 5; break;
    case ACTION_COMPLETE_AI_CHAT: pointsToAdd = 10; break;
    case ACTION_SHARE_PASSPORT:
      pointsToAdd = 20;
      userData.passportShares = (userData.passportShares || 0) + 1;
      break;
    case ACTION_LOG_MEDICATION:
      pointsToAdd = 15;
      userData.healthEntries = (userData.healthEntries || 0) + 1;
      break;
    case ACTION_COMPLETE_WORKOUT:
      pointsToAdd = 25;
      userData.workoutsCompleted = (userData.workoutsCompleted || 0) + 1;
      break;
    case ACTION_LOG_MEAL:
      pointsToAdd = 5;
      userData.mealsLogged = (userData.mealsLogged || 0) + 1;
      break;
    case ACTION_COMPLETE_ASSESSMENT:
      pointsToAdd = 30;
      userData.assessmentsCompleted = (userData.assessmentsCompleted || 0) + 1;
      break;
    case ACTION_REGISTER_NEED:
      pointsToAdd = 10;
      userData.needsRegistered = (userData.needsRegistered || 0) + 1;
      break;
    case ACTION_CONFIRM_CARE:
      pointsToAdd = 50;
      userData.careConfirmations = (userData.careConfirmations || 0) + 1;
      break;
    case ACTION_REFERRAL_SIGNUP:
      pointsToAdd = 200;
      userData.referralsSuccessful = (userData.referralsSuccessful || 0) + 1;
      break;
    default: pointsToAdd = 0;
  }

  userData.points += pointsToAdd;

  // Streak bonuses
  const streakBonus = await checkAndAwardStreakBonuses(db, userId, actionType);
  userData.points += streakBonus;

  await store.put(userData);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  // Check badges
  await checkAndAwardBadge(db, userId);

  return userData.points;
};

/**
 * Get total points for a user
 */
export const getTotalPoints = async (userId) => {
  const db = await openDB();
  const tx = db.transaction(REWARDS_STORE, 'readonly');
  const store = tx.objectStore(REWARDS_STORE);
  const req = store.get(userId);

  const userData = await new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  return userData ? userData.points : 0;
};

/**
 * Get badges for a user
 */
export const getBadges = async (userId) => {
  const db = await openDB();
  const tx = db.transaction(BADGES_STORE, 'readonly');
  const store = tx.objectStore(BADGES_STORE);
  const index = store.index('userId');
  const req = index.getAll(userId);

  const badgeEntries = await new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  return badgeEntries.map(entry => ({
    id: entry.badgeId,
    name: BADGES.find(b => b.id === entry.badgeId)?.name || 'Unknown',
    icon: BADGES.find(b => b.id === entry.badgeId)?.icon || '❓',
    earnedAt: entry.earnedAt
  }));
};

/**
 * Check and award badge for a user
 */
const checkAndAwardBadge = async (db, userId) => {
  const tx = db.transaction(REWARDS_STORE, 'readonly');
  const store = tx.objectStore(REWARDS_STORE);
  const req = store.get(userId);
  let userData = await new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  if (!userData) {
    userData = {
      userId,
      points: 0,
      healthEntries: 0,
      workoutsCompleted: 0,
      mealsLogged: 0,
      passportShares: 0,
      assessmentsCompleted: 0,
      needsRegistered: 0,
      careConfirmations: 0,
      referralsSuccessful: 0,
      firstAidUsages: 0,
      onboardingCompleted: false,
      cycleMonthsTracked: 0
    };
  }

  const badgesTx = db.transaction(BADGES_STORE, 'readonly');
  const badgesStore = badgesTx.objectStore(BADGES_STORE);
  const badgesIndex = badgesStore.index('userId');
  const badgesReq = badgesIndex.getAll(userId);

  const existingBadgeEntries = await new Promise((resolve) => {
    badgesReq.onsuccess = () => resolve(badgesReq.result || []);
    badgesReq.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    badgesTx.oncomplete = () => resolve();
  });

  const existingBadgeIds = new Set(existingBadgeEntries.map(entry => entry.badgeId));
  const newlyEarned = [];

  for (const badge of BADGES) {
    if (!existingBadgeIds.has(badge.id) && badge.criteria(userData)) {
      const awardTx = db.transaction(BADGES_STORE, 'readwrite');
      const awardStore = awardTx.objectStore(BADGES_STORE);
      await awardStore.put({
        userId,
        badgeId: badge.id,
        earnedAt: new Date().toISOString()
      });
      await new Promise((resolve) => {
        awardTx.oncomplete = () => resolve();
      });

      newlyEarned.push({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        earnedAt: new Date().toISOString()
      });
    }
  }

  return newlyEarned;
};

/**
 * Update streak for a user
 */
const updateStreak = async (db, userId, actionType) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streakTypeMap = {
    [ACTION_LOGIN_DAILY]: 'login',
    [ACTION_LOG_MEDICATION]: 'medication',
    [ACTION_COMPLETE_WORKOUT]: 'workout',
    [ACTION_LOG_MEAL]: 'meal'
  };

  const streakType = streakTypeMap[actionType];
  if (!streakType) return;

  const streaksTx = db.transaction(STREAKS_STORE, 'readwrite');
  const streaksStore = streaksTx.objectStore(STREAKS_STORE);
  const streakKey = [userId, streakType];
  const getReq = streaksStore.get(streakKey);

  let streakData = await new Promise((resolve) => {
    getReq.onsuccess = () => resolve(getReq.result);
    getReq.onerror = () => resolve(null);
  });

  if (!streakData) {
    streakData = {
      userId,
      type: streakType,
      current: 0,
      longest: 0,
      lastActivityDate: null
    };
  }

  const lastActivityDate = streakData.lastActivityDate
    ? new Date(streakData.lastActivityDate)
    : null;

  const daysDiff = lastActivityDate
    ? Math.floor((today - lastActivityDate) / (1000 * 60 * 60 * 24))
    : null;

  if (lastActivityDate && daysDiff > 1) {
    streakData.current = 0;
  }

  streakData.current += 1;
  if (streakData.current > streakData.longest) {
    streakData.longest = streakData.current;
  }
  streakData.lastActivityDate = today.toISOString();

  await streaksStore.put(streakData);

  await new Promise((resolve) => {
    streaksTx.oncomplete = () => resolve();
  });

  return streakData;
};

/**
 * Check and award streak bonuses
 */
const checkAndAwardStreakBonuses = async (db, userId, actionType) => {
  if (actionType !== ACTION_LOGIN_DAILY) return 0;

  const tx = db.transaction(STREAKS_STORE, 'readonly');
  const store = tx.objectStore(STREAKS_STORE);
  const req = store.get([userId, 'login']);

  const streakData = await new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  if (!streakData) return 0;

  let bonusPoints = 0;
  if (streakData.current === 7) {
    bonusPoints += 100;
  }
  if (streakData.current === 30) {
    bonusPoints += 500;
  }
  return bonusPoints;
};

/**
 * Get streak for a user and streak type
 */
export const getStreak = async (userId, streakType) => {
  const db = await openDB();
  const tx = db.transaction(STREAKS_STORE, 'readonly');
  const store = tx.objectStore(STREAKS_STORE);
  const req = store.get([userId, streakType]);

  const streakData = await new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  if (!streakData) {
    return { current: 0, longest: 0 };
  }

  return {
    current: streakData.current,
    longest: streakData.longest
  };
};

/**
 * Get leaderboard (local only)
 */
export const getLeaderboard = async (limit = 10) => {
  const db = await openDB();
  const tx = db.transaction(REWARDS_STORE, 'readonly');
  const store = tx.objectStore(REWARDS_STORE);
  const req = store.getAll();

  const allUserData = await new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  const sortedUsers = allUserData
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((user, index) => ({
      userId: user.userId,
      points: user.points,
      rank: index + 1
    }));

  return sortedUsers;
};

/**
 * Redeem points for a reward
 */
export const redeemPoints = async (userId, rewardId) => {
  const db = await openDB();
  const tx = db.transaction(REWARDS_STORE, 'readwrite');
  const store = tx.objectStore(REWARDS_STORE);
  const req = store.get(userId);

  const userData = await new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  if (!userData) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, newBalance: 0 };
  }

  const rewardCosts = {
    health_tip: 50,
    workout_plan: 100,
    nutrition_guide: 150,
    premium_feature: 500
  };

  const cost = rewardCosts[rewardId] || 0;

  if (userData.points < cost) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, newBalance: userData.points };
  }

  userData.points -= cost;
  await store.put(userData);

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return { success: true, newBalance: userData.points };
};

export default {
  initRewardsDB: openDB,
  ACTION_LOGIN_DAILY,
  ACTION_COMPLETE_AI_CHAT,
  ACTION_SHARE_PASSPORT,
  ACTION_LOG_MEDICATION,
  ACTION_COMPLETE_WORKOUT,
  ACTION_LOG_MEAL,
  ACTION_COMPLETE_ASSESSMENT,
  ACTION_REGISTER_NEED,
  ACTION_CONFIRM_CARE,
  ACTION_MAINTAIN_STREAK_7D,
  ACTION_MAINTAIN_STREAK_30D,
  ACTION_REFERRAL_SIGNUP,
  BADGES,
  awardPoints,
  getTotalPoints,
  getBadges,
  checkAndAwardBadge,
  getStreak,
  getLeaderboard,
  redeemPoints
};
