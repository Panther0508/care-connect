// src/context/AdminContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { adminService, AdminAuthState } from '../lib/admin';

interface AdminContextType extends AdminAuthState {
  unlockAdmin: (pin: string, useBiometric?: boolean) => Promise<boolean>;
  lockAdmin: () => void;
  verifyBiometric: () => Promise<boolean>;
  queueAdminAction: (action: string, payload: any) => Promise<void>;
  syncAdminActions: () => Promise<void>;
  signOut: () => Promise<void>;
  isLocked: () => Promise<boolean>;
  refreshToken: () => Promise<string | null>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps): JSX.Element {
  const [state, setState] = useState<AdminAuthState>(adminService.getState());

  useEffect(() => {
    // Subscribe to admin service changes
    const unsubscribe = adminService.subscribe(() => {
      setState(adminService.getState());
    });

    return unsubscribe;
  }, []);

  const unlockAdmin = async (pin: string, useBiometric: boolean = false): Promise<boolean> => {
    try {
      const result = await adminService.unlockAdmin(pin, useBiometric);
      setState(adminService.getState());
      return result;
    } catch (error) {
      console.error('Failed to unlock admin:', error);
      throw error;
    }
  };

  const lockAdmin = (): void => {
    adminService.lockAdmin();
    setState(adminService.getState());
  };

  const verifyBiometric = async (): Promise<boolean> => {
    return adminService.verifyBiometric();
  };

  const queueAdminAction = async (action: string, payload: any): Promise<void> => {
    await adminService.queueAdminAction(action, payload);
  };

  const syncAdminActions = async (): Promise<void> => {
    await adminService.syncAdminActions();
  };

  const signOut = async (): Promise<void> => {
    await adminService.signOut();
    setState(adminService.getState());
  };

  const isLocked = async (): Promise<boolean> => {
    return adminService.isLocked();
  };

  const refreshToken = async (): Promise<string | null> => {
    return adminService.refreshToken();
  };

  return (
    <AdminContext.Provider
      value={{
        ...state,
        unlockAdmin,
        lockAdmin,
        verifyBiometric,
        queueAdminAction,
        syncAdminActions,
        signOut,
        isLocked,
        refreshToken,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
