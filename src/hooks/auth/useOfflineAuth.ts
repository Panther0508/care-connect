import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getItem, setItem, removeItem } from '../../lib/idb';

const OFFLINE_TOKEN_KEY = 'vita_offline_token';
const OFFLINE_USER_KEY = 'vita_offline_user';
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

interface OfflineUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  publicMetadata: {
    role: string;
    hasCompletedOnboarding: boolean;
  };
}

interface OfflineToken {
  token: string;
  expiresAt: number;
  user: OfflineUser;
}

export function useOfflineAuth() {
  const { isSignedIn, isLoaded, getToken, signOut, user } = useAuth();
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineToken, setOfflineToken] = useState<OfflineToken | null>(null);

  // Store token and user data in encrypted IndexedDB
  const storeOfflineAuth = useCallback(async (tokenData: OfflineToken) => {
    try {
      await setItem(OFFLINE_TOKEN_KEY, tokenData);
      console.log('Offline auth data stored');
    } catch (error) {
      console.error('Failed to store offline auth:', error);
    }
  }, []);

  // Retrieve and validate offline token
  const retrieveOfflineAuth = useCallback(async (): Promise<OfflineToken | null> => {
    try {
      const stored = await getItem<OfflineToken>(OFFLINE_TOKEN_KEY);
      if (!stored) return null;

      // Check if token is within grace period
      const now = Date.now();
      if (now > stored.expiresAt + GRACE_PERIOD_MS) {
        console.log('Offline token expired');
        await removeItem(OFFLINE_TOKEN_KEY);
        return null;
      }

      return stored;
    } catch (error) {
      console.error('Failed to retrieve offline auth:', error);
      return null;
    }
  }, []);

  // Clear offline auth data
  const clearOfflineAuth = useCallback(async () => {
    try {
      await removeItem(OFFLINE_TOKEN_KEY);
      await removeItem(OFFLINE_USER_KEY);
      setOfflineToken(null);
    } catch (error) {
      console.error('Failed to clear offline auth:', error);
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Attempt to refresh token when back online
      if (isSignedIn && getToken) {
        getToken({ forceRefresh: true }).then((newToken) => {
          console.log('Token refreshed after reconnect');
        });
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSignedIn, getToken]);

  // Check for offline token on mount
  useEffect(() => {
    const checkOfflineAuth = async () => {
      if (isOffline && !isSignedIn) {
        const token = await retrieveOfflineAuth();
        if (token) {
          setOfflineToken(token);
          console.log('Offline auth restored for user:', token.user.id);
        }
      }
    };

    if (isLoaded) {
      checkOfflineAuth().then(() => setIsOfflineReady(true));
    }
  }, [isLoaded, isOffline, isSignedIn, retrieveOfflineAuth]);

  // Store current session when signed in
  useEffect(() => {
    if (isSignedIn && user && !isOffline) {
      // Get fresh token
      getToken().then((token) => {
        if (token) {
          const expiresAt = Date.now() + 60 * 1000; // Clerk tokens are ~60s
          const offlineData: OfflineToken = {
            token,
            expiresAt,
            user: {
              id: user.id,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.emailAddresses[0]?.emailAddress || '',
              imageUrl: user.imageUrl || '',
              publicMetadata: user.publicMetadata as any,
            },
          };
          storeOfflineAuth(offlineData);
          setOfflineToken(offlineData);
        }
      });
    }
  }, [isSignedIn, user, getToken, storeOfflineAuth, isOffline]);

  const signOutWithOfflineClear = useCallback(async () => {
    await clearOfflineAuth();
    return signOut();
  }, [clearOfflineAuth, signOut]);

  // Determine if user can access the app
  const canAccessApp = isSignedIn || (offlineToken !== null);

  return {
    isSignedIn,
    isLoaded,
    isOffline,
    offlineToken: offlineToken?.user || null,
    isOfflineReady,
    canAccessApp,
    signOut: signOutWithOfflineClear,
    refreshToken: async () => {
      if (isSignedIn && getToken) {
        return await getToken({ forceRefresh: true });
      }
      return offlineToken?.token || null;
    },
  };
}
