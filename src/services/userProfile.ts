// src/services/userProfile.ts
// User profile management with local storage (offline-only, local storage only)

import { deriveKey, encrypt, decrypt, generateSalt } from '../lib/encryption';
import { getUserProfile as saveToIDB, storeUserProfile, getUserProfile as loadFromIDB } from '../lib/idb';

const PROFILE_KEY = 'user_profile_v1';

export interface ProfileData {
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
}

export async function loadProfile(userId: string, passphrase: string): Promise<ProfileData | null> {
  // Try encrypted storage first (local)
  try {
    const record = await loadFromIDB(userId);
    if (record) {
      // Decrypt fields if they were encrypted; for now they're plain in DB
      return record as any;
    }
  } catch (e) {
    console.error('Failed to load profile from IDB:', e);
  }
  return null;
}

export async function saveProfile(userId: string, passphrase: string, data: ProfileData): Promise<void> {
  const profile = {
    ...data,
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as any;

  // Store in IndexedDB (plain for now; could encrypt sensitive fields)
  await storeUserProfile(profile);
}