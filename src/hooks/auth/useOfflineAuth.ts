import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getItem, setItem, removeItem } from '../../lib/idb';

const OFFLINE_USER_KEY = 'vita_offline_user';

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

export function useOfflineAuth() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineUser, setOfflineUser] = useState<OfflineUser | null>(null);

  // Store user data in IndexedDB
  const storeOfflineUser = useCallback(async (userData: OfflineUser) => {
    try {
      await setItem(OFFLINE_USER_KEY, userData);
      console.log('Offline user data stored');
    } catch (error) {
      console.error('Failed to store offline user:', error);
    }
  }, []);

  // Retrieve offline user
  const retrieveOfflineUser = useCallback(async (): Promise<OfflineUser | null> => {
    try {
      const stored = await getItem<OfflineUser>(OFFLINE_USER_KEY);
      return stored;
    } catch (error) {
      console.error('Failed to retrieve offline user:', error);
      return null;
    }
  }, []);

  // Clear offline user data
  const clearOfflineAuth = useCallback(async () => {
    try {
      await removeItem(OFFLINE_USER_KEY);
      setOfflineUser(null);
    } catch (error) {
      console.error('Failed to clear offline auth:', error);
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for offline user on mount
  useEffect(() => {
    const checkOfflineAuth = async () => {
      if (isOffline) {
        const userData = await retrieveOfflineUser();
        if (userData) {
          setOfflineUser(userData);
          console.log('Offline user restored:', userData.id);
        }
      }
    };

    if (isLoaded) {
      checkOfflineAuth().then(() => setIsOfflineReady(true));
    }
  }, [isLoaded, isOffline, retrieveOfflineUser]);

  // Store current session when signed in
  useEffect(() => {
    if (isSignedIn && user) {
      const offlineData: OfflineUser = {
        id: user.id,
        firstName: user.fullName?.split(' ')[0] || '',
        lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
        email: '',
        imageUrl: user.imageUrl || '',
        publicMetadata: {
          role: (user.publicMetadata?.role as string) || 'patient',
          hasCompletedOnboarding: false,
        },
      };
      storeOfflineUser(offlineData);
      setOfflineUser(offlineData);
    }
  }, [isSignedIn, user, storeOfflineUser]);

  // Sign out - clear offline data
  const signOut = useCallback(async () => {
    await clearOfflineAuth();
    localStorage.removeItem("vitachain_session");
    localStorage.removeItem("vitachain_onboarded");
    localStorage.removeItem("user_role");
    localStorage.removeItem("onboarding_completed");
    localStorage.removeItem("user_name");
  }, [clearOfflineAuth]);

  // Determine if user can access the app
  const canAccessApp = isSignedIn || (offlineUser !== null);

  return {
    isSignedIn,
    isLoaded,
    isOffline,
    offlineUser,
    isOfflineReady,
    canAccessApp,
    signOut,
    refreshToken: async () => null,
  };
}