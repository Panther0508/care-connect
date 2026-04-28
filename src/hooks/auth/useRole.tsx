import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect } from 'react';
import { getRoleFromMetadata, ROLES, UserRole, hasPermission, ROLE_PERMISSIONS } from '../../lib/roles';

export function useRole() {
  const { user, isLoaded } = useAuth();

  // Sync Clerk metadata to localStorage when it arrives
  useEffect(() => {
    if (isLoaded && user) {
      const clerkRole = getRoleFromMetadata(user.publicMetadata);
      if (clerkRole) {
        localStorage.setItem('user_role', clerkRole);
      }
    }
  }, [isLoaded, user]);

  // Compute role fresh on every render (no memo)
  const role: UserRole | null = (() => {
    // If Clerk has loaded and has metadata, use that
    if (isLoaded && user) {
      const clerkRole = getRoleFromMetadata(user.publicMetadata);
      if (clerkRole) return clerkRole;
    }
    // Fallback to localStorage (works immediately after onboarding)
    const stored = localStorage.getItem('user_role');
    return stored as UserRole | null;
  })();

  const permissions = role ? (ROLE_PERMISSIONS[role] || []) : [];

  const hasRole = useCallback((requiredRole: UserRole | UserRole[]): boolean => {
    if (!role) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(role);
  }, [role]);

  const can = useCallback((permission: string): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  }, [role]);

  const isAdmin = role === ROLES.ADMIN;
  const isClinician = role === ROLES.CLINICIAN;
  const isCHW = role === ROLES.CHW;
  const isPatient = role === ROLES.PATIENT;

  return {
    role,
    permissions,
    hasRole,
    can,
    isAdmin,
    isClinician,
    isCHW,
    isPatient,
    // Loading only if Clerk hasn't loaded AND no cached role exists
    isLoading: !isLoaded && !localStorage.getItem('user_role'),
  };
}
