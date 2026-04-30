// src/services/userProfile.ts
// User profile management with local encryption and Clerk sync

import { getUser, updateUser } from '@clerk/clerk-react';
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

export async function syncProfileToClerk(userId: string, profile: ProfileData, clerkUser: any): Promise<void> {
  try {
    await clerkUser.update({
      firstName: profile.displayName.split(' ')[0],
      lastName: profile.displayName.split(' ').slice(1).join(' ') || '',
      publicMetadata: {
        ...clerkUser.publicMetadata,
        gender: profile.gender,
        biologicalSex: profile.biologicalSex,
        dateOfBirth: profile.dateOfBirth,
        height: profile.height,
        weight: profile.weight,
        activityLevel: profile.activityLevel,
        preferredLanguage: profile.preferredLanguage,
        enableCycleTracking: profile.enableCycleTracking,
      },
    });
  } catch (err) {
    console.error('Failed to sync profile to Clerk:', err);
    throw err;
  }
}

export async function loadProfileFromClerk(clerkUser: any): Promise<ProfileData | null> {
  const meta = clerkUser.publicMetadata;
  if (!meta) return null;

  return {
    displayName: clerkUser.fullName || '',
    phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || '',
    gender: meta.gender || '',
    biologicalSex: meta.biologicalSex || '',
    dateOfBirth: meta.dateOfBirth || null,
    height: meta.height || null,
    weight: meta.weight || null,
    activityLevel: meta.activityLevel || '',
    avatarUrl: clerkUser.imageUrl || '',
    preferredLanguage: meta.preferredLanguage || 'en',
    enableCycleTracking: meta.enableCycleTracking || false,
  };
}
