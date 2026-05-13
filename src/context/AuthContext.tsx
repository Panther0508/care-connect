import { createContext, useContext, type ReactNode, useState } from "react";

export interface User {
  id: string;
  fullName?: string | null;
  imageUrl?: string;
  publicMetadata?: Record<string, unknown>;
}

export interface AuthContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: User | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isLoaded: true,
  isSignedIn: true,
  user: null,
  signOut: async () => {}, // default no-op
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedRole = localStorage.getItem("user_role");
  const userName = localStorage.getItem("user_name") || "User";

  const signOut = async () => {
    // 1. Clear all localStorage
    localStorage.clear();
    
    // 2. Delete all IndexedDB databases
    if ('indexedDB' in window) {
      try {
        const dbs = await (indexedDB as any).databases();
        for (const db of dbs || []) {
          if (db.name) {
            await new Promise<void>((resolve, reject) => {
              const request = (indexedDB as any).deleteDatabase(db.name);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            });
          }
        }
      } catch (err) {
        console.warn('Error clearing IndexedDB during sign-out:', err);
      }
    }
    
    // 3. Reload page to reset all state and return to onboarding
    window.location.href = '/';
  };

  const value: AuthContextValue = {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "offline-user",
      fullName: userName,
      imageUrl: undefined,
      publicMetadata: {
        role: storedRole,
      },
    },
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
