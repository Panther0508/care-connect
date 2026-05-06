// src/lib/dataMigration.ts
// Migrates existing localStorage user data to IndexedDB on first run

import { storeUserProfile, getUserProfile, storeSetting, storeAppState, getAppState } from './idb';
import { UserProfile } from './idb';

const MIGRATION_KEY = 'data_migration_v1_complete';

export async function runMigration(): Promise<boolean> {
  const alreadyDone = localStorage.getItem(MIGRATION_KEY);
  if (alreadyDone) return true;

   try {
     const userId = localStorage.getItem('vitachain_user_id') || 'default-user';

     // Store user_id in IDB for async access
     await storeSetting('user_id', userId);

     // 1. Migrate user profile from localStorage (if present)
     const storedProfile = localStorage.getItem('vitachain_user_profile');
     if (storedProfile) {
       try {
         const profileData = JSON.parse(storedProfile);
         const profile: UserProfile = {
           userId: profileData.userId || userId,
           displayName: profileData.displayName || '',
           phone: profileData.phone || '',
           gender: profileData.gender || '',
           biologicalSex: profileData.biologicalSex || '',
           dateOfBirth: profileData.dateOfBirth || null,
           height: profileData.height || null,
           weight: profileData.weight || null,
           activityLevel: profileData.activityLevel || '',
           avatarUrl: profileData.avatarUrl || '',
           preferredLanguage: profileData.preferredLanguage || 'en',
           enableCycleTracking: profileData.enableCycleTracking || false,
           createdAt: profileData.createdAt || Date.now(),
           updatedAt: Date.now()
         };
         await storeUserProfile(profile);
       } catch (e) {
         console.warn('Failed to migrate user profile:', e);
       }
     }

     // 1b. Migrate passphrase if present (legacy storage)
     const legacyPassphrase = localStorage.getItem('vita_user_passphrase');
     if (legacyPassphrase) {
       try {
         await storeSetting('user_passphrase', legacyPassphrase);
       } catch (e) {
         console.warn('Failed to migrate passphrase:', e);
       }
     }

    // 2. Migrate settings (biometric, notification prefs)
    const biometricEnabled = localStorage.getItem('biometric_enabled');
    if (biometricEnabled !== null) {
      await storeSetting('biometric_enabled', biometricEnabled === 'true');
    }

    const notificationPrefs = localStorage.getItem('notification_prefs');
    if (notificationPrefs) {
      try {
        const prefs = JSON.parse(notificationPrefs);
        await storeSetting('notification_prefs', prefs);
      } catch (e) {
        console.warn('Failed to migrate notification prefs:', e);
      }
    }

    // 3. Migrate language preference
    const language = localStorage.getItem('preferredLanguage');
    if (language) {
      await storeAppState('preferredLanguage', language);
      // Also update i18n if available
      if (typeof window !== 'undefined' && (window as any).i18n) {
        try {
          (window as any).i18n.changeLanguage(language);
        } catch (e) { /* ignore */ }
      }
    }

    // 4. Migrate onboarding completion flag
    const onboardingCompleted = localStorage.getItem('onboarding_completed') === 'true' ||
                                localStorage.getItem('vitachain_onboarded') === 'true';
    if (onboardingCompleted) {
      await storeAppState('onboardingCompleted', true);
    }

    // 5. Migrate chat history entries (if any were stored in localStorage as fallback)
    // Note: The app uses IndexedDB primarily, but check for any localStorage fallback
    const chatHistoryJson = localStorage.getItem('vitachain_chat_history');
    if (chatHistoryJson) {
      try {
        const entries = JSON.parse(chatHistoryJson);
        if (Array.isArray(entries)) {
          // Import to IDB via existing storeChatEntry function - we'll handle in useIDB hook
          console.log('Found chat history in localStorage, will migrate via hook');
        }
      } catch (e) { /* ignore */ }
    }

    // Mark migration complete
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('✅ Data migration to IndexedDB complete');
    return true;
  } catch (err) {
    console.error('❌ Data migration failed:', err);
    return false;
  }
}
