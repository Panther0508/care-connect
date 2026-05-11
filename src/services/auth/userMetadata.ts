import type { User } from '../../context/AuthContext';
import { getItem, setItem } from '../../lib/idb';

const ROLE_CACHE_KEY = 'pending_user_role';

export async function updateUserMetadata(
  userId: string,
  metadata: {
    role?: string;
    language?: string;
    hasCompletedOnboarding?: boolean;
    onboardingCompletedAt?: string;
  }
): Promise<void> {
  // Store role to IndexedDB (async, non-blocking)
  if (metadata.role) {
    try {
      await setItem(ROLE_CACHE_KEY, metadata.role);
    } catch (e) {
      console.warn('Failed to cache user_role in IDB:', e);
    }
  }

  // Store onboarding flags to IndexedDB (async, non-blocking)
  if (metadata.hasCompletedOnboarding) {
    try {
      await setItem('onboardingCompleted', true);
      await setItem('onboarding_completed', true); // also store legacy key for compatibility
    } catch (e) {
      console.warn('Failed to cache onboarding flags in IDB:', e);
    }
  }

  console.log('User metadata cached locally:', userId, metadata);
}

export async function getUserRole(user: User): Promise<string | null> {
  // Check publicMetadata first
  const metadataRole = user.publicMetadata?.role as string | undefined;
  if (metadataRole) return metadataRole;

  // Fallback to cached role from onboarding (IndexedDB)
  const cachedRole = await getItem<string>(ROLE_CACHE_KEY);
  if (cachedRole) return cachedRole;

  // Fallback to localStorage (synchronous, but this is last resort)
  const localRole = localStorage.getItem('user_role');
  if (localRole) return localRole;

  return null;
}
