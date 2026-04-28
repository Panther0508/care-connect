import { User, api } from '@clerk/clerk-react';
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
  // Store role locally for immediate use (optimistic update)
  if (metadata.role) {
    await setItem(ROLE_CACHE_KEY, metadata.role);
  }

  // Also store in localStorage as fallback
  if (metadata.role) {
    localStorage.setItem('user_role', metadata.role);
  }

  console.log('User metadata cached locally:', userId, metadata);

  // In production, this would use Clerk's Admin API via a backend endpoint:
  // POST /api/users/{userId}/metadata
  // For now, we rely on the cached role until backend is connected
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
