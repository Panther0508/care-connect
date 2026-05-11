import { createContext, useContext, type ReactNode } from "react";

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
}

const AuthContext = createContext<AuthContextValue>({
  isLoaded: true,
  isSignedIn: true,
  user: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedRole = localStorage.getItem("user_role");
  const userName = localStorage.getItem("user_name") || "User";

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
