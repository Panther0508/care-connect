import { User } from '@clerk/clerk-react';
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
  // Store role immediately in localStorage (synchronous, best-effort)
  if (metadata.role) {
    try {
      localStorage.setItem('user_role', metadata.role);
    } catch (e) {
      console.warn('Failed to write user_role to localStorage:', e);
    }
  }

  // Also store onboarding completion flag
  if (metadata.hasCompletedOnboarding) {
    try {
      localStorage.setItem('onboarding_completed', 'true');
    } catch (e) {
      console.warn('Failed to write onboarding_completed to localStorage:', e);
    }
  }

  // Best-effort async cache to IndexedDB for offline use
  if (metadata.role) {
    try {
      await setItem(ROLE_CACHE_KEY, metadata.role);
    } catch (e) {
      // IndexedDB might be unavailable; ignore
    }
  }

  console.log('User metadata cached locally:', userId, metadata);
}

export async function getUserRole(user: User): Promise<string | null> {
  // Check Clerk publicMetadata first
  const clerkRole = user.publicMetadata?.role as string | undefined;
  if (clerkRole) return clerkRole;

  // Fallback to cached role from onboarding
  const cachedRole = await getItem<string>(ROLE_CACHE_KEY);
  if (cachedRole) return cachedRole;

  // Fallback to localStorage
  const localRole = localStorage.getItem('user_role');
  if (localRole) return localRole;

  return null;
}
