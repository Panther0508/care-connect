import { User } from '@clerk/clerk-react';

export async function updateUserMetadata(
  userId: string,
  metadata: {
    role?: string;
    language?: string;
    hasCompletedOnboarding?: boolean;
    onboardingCompletedAt?: string;
  }
): Promise<void> {
  // In a real app, this would use Clerk's Admin API to update user metadata
  // For now, this is a placeholder - Clerk's client-side API doesn't support
  // updating publicMetadata directly after sign-up
  console.log('Updating user metadata:', userId, metadata);

  // Implementation would use backend API endpoint that calls Clerk Admin API
  // POST /api/users/{userId}/metadata
}

export async function getUserRole(user: User): Promise<string | null> {
  return user.publicMetadata?.role as string || null;
}
