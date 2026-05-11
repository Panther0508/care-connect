// src/services/avatarCustomization.js
// Avatar Customization - Unlockable accessories
// Uses native IndexedDB

import { openDB } from '../lib/idb';
const DB_NAME = 'vitachain-avatar';
const DB_VERSION = 1;
const AVATAR_STORE = 'avatarData';

let dbInstance = null;

// Accessory definitions
export const ACCESSORIES = [
  // Headwear
  {
    id: 'cowboy_hat',
    name: 'Cowboy Hat',
    category: 'headwear',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.points >= 100,
    position: { x: '50%', y: '20%', scale: 1.2 }
  },
  {
    id: 'nurse_cap',
    name: 'Nurse Cap',
    category: 'headwear',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.badges?.includes('health_scribe') || false,
    position: { x: '50%', y: '25%', scale: 1.1 }
  },
  {
    id: 'graduation_cap',
    name: 'Graduation Cap',
    category: 'headwear',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.points >= 500,
    position: { x: '50%', y: '15%', scale: 1.3 }
  },
  {
    id: 'crown',
    name: 'Crown',
    category: 'headwear',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.badges?.includes('vitachain_advocate') || false,
    position: { x: '50%', y: '20%', scale: 1.15 }
  },
  {
    id: 'headwrap_gele',
    name: 'Headwrap/Gele',
    category: 'headwear',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.points >= 300,
    position: { x: '50%', y: '22%', scale: 1.1 }
  },
  // Eyewear
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    category: 'eyewear',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.points >= 150,
    position: { x: '50%', y: '45%', scale: 1.0 }
  },
  {
    id: 'reading_glasses',
    name: 'Reading Glasses',
    category: 'eyewear',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.badges?.includes('health_scribe') || false,
    position: { x: '50%', y: '45%', scale: 1.0 }
  },
  {
    id: 'monocle',
    name: 'Monocle',
    category: 'eyewear',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.points >= 200,
    position: { x: '70%', y: '40%', scale: 0.8 }
  },
  // Neckwear
  {
    id: 'stethoscope',
    name: 'Stethoscope',
    category: 'neckwear',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.badges?.includes('medication_master') || false,
    position: { x: '50%', y: '60%', scale: 1.0 }
  },
  {
    id: 'scarf',
    name: 'Scarf',
    category: 'neckwear',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.points >= 250,
    position: { x: '50%', y: '65%', scale: 1.2 }
  },
  {
    id: 'bead_necklace',
    name: 'Bead Necklace',
    category: 'neckwear',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.badges?.includes('community_guardian') || false,
    position: { x: '50%', y: '60%', scale: 1.1 }
  },
  // Handheld
  {
    id: 'clipboard',
    name: 'Clipboard',
    category: 'handheld',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.badges?.includes('health_scribe') || false,
    position: { x: '30%', y: '50%', scale: 0.9 }
  },
  {
    id: 'dumbbell',
    name: 'Dumbbell',
    category: 'handheld',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.badges?.includes('workout_warrior') || false,
    position: { x: '70%', y: '50%', scale: 0.9 }
  },
  {
    id: 'first_aid_kit',
    name: 'First Aid Kit',
    category: 'handheld',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.badges?.includes('first_responder') || false,
    position: { x: '30%', y: '70%', scale: 0.8 }
  },
  // Backgrounds
  {
    id: 'hearts_pattern',
    name: 'Hearts Pattern',
    category: 'background',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.badges?.includes('mindful_soul') || false,
    position: { x: '50%', y: '50%', scale: 1.0 }
  },
  {
    id: 'stars_pattern',
    name: 'Stars Pattern',
    category: 'background',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.points >= 1000,
    position: { x: '50%', y: '50%', scale: 1.0 }
  },
  {
    id: 'teal_gradient',
    name: 'Teal Gradient',
    category: 'background',
    svgPath: 'M12 2l3.09 6.26L23 9h-3.18l-.91-4.53L12 0l-2.91 4.53-.91 4.53H1l3.18 6.26L12 2z',
    unlockCondition: (userData) => userData.badges?.includes('vitachain_advocate') || false,
    position: { x: '50%', y: '50%', scale: 1.0 }
  }
];

/**
 * Get unlocked accessories for a user
 */
export const getUnlockedAccessories = async (userId) => {
  const db = await openDB();
  const tx = db.transaction(AVATAR_STORE, 'readonly');
  const store = tx.objectStore(AVATAR_STORE);
  const getRequest = store.get(userId);

  const userData = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  const data = userData || { userId, unlocked: [], equipped: [] };
  return ACCESSORIES.filter(accessory =>
    data.unlocked.includes(accessory.id) ||
    accessory.unlockCondition(data || { points: 0, badges: [] })
  );
};

/**
 * Get all accessories with lock status
 */
export const getAllAccessories = async (userId) => {
  const db = await openDB();
  const tx = db.transaction(AVATAR_STORE, 'readonly');
  const store = tx.objectStore(AVATAR_STORE);
  const getRequest = store.get(userId);

  const userData = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  const data = userData || { userId, unlocked: [], equipped: [] };
  return ACCESSORIES.map(accessory => ({
    ...accessory,
    unlocked: data.unlocked.includes(accessory.id) ||
              accessory.unlockCondition(data || { points: 0, badges: [] })
  }));
};

/**
 * Unlock an accessory for a user
 */
export const unlockAccessory = async (userId, accessoryId) => {
  const db = await openDB();
  const tx = db.transaction(AVATAR_STORE, 'readwrite');
  const store = tx.objectStore(AVATAR_STORE);
  const getRequest = store.get(userId);

  let userData = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  if (!userData) {
    userData = { userId, unlocked: [], equipped: [] };
  }

  if (userData.unlocked.includes(accessoryId)) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: true, newAccessory: accessoryId };
  }

  const accessory = ACCESSORIES.find(a => a.id === accessoryId);
  if (!accessory) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, error: 'Accessory not found' };
  }

  if (!accessory.unlockCondition(userData || { points: 0, badges: [] })) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, error: 'Requirements not met' };
  }

  userData.unlocked.push(accessoryId);
  await store.put(userData);

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return { success: true, newAccessory: accessoryId };
};

/**
 * Equip an accessory for a user
 */
export const equipAccessory = async (userId, accessoryId) => {
  const db = await openDB();
  const tx = db.transaction(AVATAR_STORE, 'readwrite');
  const store = tx.objectStore(AVATAR_STORE);
  const getRequest = store.get(userId);

  let userData = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  if (!userData) {
    userData = { userId, unlocked: [], equipped: [] };
  }

  const isUnlocked = userData.unlocked.includes(accessoryId) ||
                     ACCESSORIES.find(a => a.id === accessoryId)?.unlockCondition(userData || { points: 0, badges: [] });

  if (!isUnlocked) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: false, error: 'Accessory not unlocked' };
  }

  if (userData.equipped.includes(accessoryId)) {
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
    return { success: true };
  }

  const accessory = ACCESSORIES.find(a => a.id === accessoryId);
  if (accessory) {
    userData.equipped = userData.equipped.filter(equippedId => {
      const equippedAccessory = ACCESSORIES.find(a => a.id === equippedId);
      return !equippedAccessory || equippedAccessory.category !== accessory.category;
    });

    userData.equipped.push(accessoryId);
    await store.put(userData);

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return { success: true };
  }

  return { success: false, error: 'Invalid accessory' };
};

/**
 * Get equipped accessories for a user
 */
export const getEquippedAccessories = async (userId) => {
  const db = await openDB();
  const tx = db.transaction(AVATAR_STORE, 'readonly');
  const store = tx.objectStore(AVATAR_STORE);
  const getRequest = store.get(userId);

  const userData = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  const data = userData || { userId, unlocked: [], equipped: [] };
  return data.equipped
    .map(id => ACCESSORIES.find(a => a.id === id))
    .filter(Boolean);
};

/**
 * Initialize default avatar data for new users
 */
export const initializeAvatarData = async (userId) => {
  const db = await openDB();
  const tx = db.transaction(AVATAR_STORE, 'readonly');
  const store = tx.objectStore(AVATAR_STORE);
  const getRequest = store.get(userId);

  const existingData = await new Promise((resolve) => {
    getRequest.onsuccess = () => resolve(getRequest.result);
    getRequest.onerror = () => resolve(null);
  });

  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });

  if (!existingData) {
    const defaultData = {
      userId,
      unlocked: [],
      equipped: []
    };

    const writeTx = db.transaction(AVATAR_STORE, 'readwrite');
    const writeStore = writeTx.objectStore(AVATAR_STORE);
    await writeStore.put(defaultData);
    await new Promise((resolve) => {
      writeTx.oncomplete = () => resolve();
    });

    return defaultData;
  }

  return existingData;
};

export default {
  initAvatarDB: openDB,
  ACCESSORIES,
  getUnlockedAccessories,
  getAllAccessories,
  unlockAccessory,
  equipAccessory,
  getEquippedAccessories,
  initializeAvatarData
};
