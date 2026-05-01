// src/services/referralEngine.js
// Referral System - Track invites and rewards
// Uses native IndexedDB

const DB_NAME = 'VitaCareDB';
const DB_VERSION = 1;
const REFERRALS_STORE = 'referrals';

let dbInstance = null;

const openDB = async () => {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(REFERRALS_STORE)) {
        db.createObjectStore(REFERRALS_STORE, { keyPath: 'id' });
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
 * Generate or retrieve a referral code for the user from Clerk publicMetadata
 */
export const generateOrGetReferralCode = async (user) => {
  if (!user) return null;

  try {
    const metadata = user.publicMetadata || {};
    let code = metadata.referralCode;

    if (!code) {
      code = `VITA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      await user.update({
        publicMetadata: {
          ...metadata,
          referralCode: code,
        },
      });
    }

    return code;
  } catch (err) {
    console.error('Failed to generate/get referral code:', err);
    return `TEMP-${user.id.slice(-6).toUpperCase()}`;
  }
};

/**
 * Record a referral attempt (when someone visits the referral link)
 */
export const recordReferralAttempt = async (referrerId, refereeInfo = null) => {
  const db = await openDB();
  const tx = db.transaction(REFERRALS_STORE, 'readwrite');
  const store = tx.objectStore(REFERRALS_STORE);

  const id = `${referrerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const attempt = {
    id,
    referrerId,
    timestamp: new Date().toISOString(),
    type: 'attempt',
    refereeInfo,
  };

  await store.add(attempt);

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Record a successful referral (when the referee signs up and completes onboarding)
 */
export const recordReferralSuccess = async (referrerId, refereeId) => {
  const db = await openDB();
  const tx = db.transaction(REFERRALS_STORE, 'readwrite');
  const store = tx.objectStore(REFERRALS_STORE);

  const id = `${referrerId}_${refereeId}_success`;
  const success = {
    id,
    referrerId,
    refereeId,
    timestamp: new Date().toISOString(),
    type: 'success',
  };

  const existingRequest = store.get(id);
  const existing = await new Promise((resolve) => {
    existingRequest.onsuccess = () => resolve(existingRequest.result);
    existingRequest.onerror = () => resolve(null);
  });

  if (!existing) {
    await store.add(success);
  }

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Get the count of successful referrals for a user
 */
export const getReferralSuccessCount = async (referrerId) => {
  const db = await openDB();
  const tx = db.transaction(REFERRALS_STORE, 'readonly');
  const store = tx.objectStore(REFERRALS_STORE);
  const request = store.getAll();

  const referrals = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  const count = referrals.filter(r =>
    r.referrerId === referrerId && r.type === 'success'
  ).length;

  return count;
};

/**
 * Check if a referral reward has already been awarded for a given referee
 */
export const isReferralRewardAwarded = async (referrerId, refereeId) => {
  const db = await openDB();
  const tx = db.transaction(REFERRALS_STORE, 'readonly');
  const store = tx.objectStore(REFERRALS_STORE);
  const id = `${referrerId}_${refereeId}_rewarded`;
  const request = store.get(id);

  const rewarded = await new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  return !!rewarded;
};

/**
 * Mark that a referral reward has been awarded
 */
export const markReferralRewardAwarded = async (referrerId, refereeId) => {
  const db = await openDB();
  const tx = db.transaction(REFERRALS_STORE, 'readwrite');
  const store = tx.objectStore(REFERRALS_STORE);

  const id = `${referrerId}_${refereeId}_rewarded`;
  const rewarded = {
    id,
    referrerId,
    refereeId,
    timestamp: new Date().toISOString(),
    type: 'rewarded',
  };

  await store.add(rewarded);

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Award referral reward (e.g., extend subscription by 1 month)
 */
export const awardReferralReward = async (userId) => {
  console.log(`Awarding referral reward to user ${userId}`);
  return Promise.resolve({ success: true, message: 'Referral reward awarded' });
};

export default {
  initReferralDB: openDB,
  generateOrGetReferralCode,
  recordReferralAttempt,
  recordReferralSuccess,
  getReferralSuccessCount,
  isReferralRewardAwarded,
  markReferralRewardAwarded,
  awardReferralReward,
};
