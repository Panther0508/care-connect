import { useAuth } from '@clerk/clerk-react';
import { useMemo, useCallback, useEffect } from 'react';
import { getRoleFromMetadata, ROLES, UserRole, hasPermission, ROLE_PERMISSIONS } from '../../lib/roles';

export function useRole() {
  const { user, isLoaded } = useAuth();

  // Sync Clerk metadata to localStorage when it arrives (for future sessions)
  useEffect(() => {
    if (isLoaded && user) {
      const clerkRole = getRoleFromMetadata(user.publicMetadata);
      if (clerkRole) {
        localStorage.setItem('user_role', clerkRole);
      }
    }
  }, [isLoaded, user]);

  const role = useMemo((): UserRole | null => {
    // If Clerk has loaded and has metadata, use that
    if (isLoaded && user) {
      const clerkRole = getRoleFromMetadata(user.publicMetadata);
      if (clerkRole) return clerkRole;
    }
    // Fallback to localStorage (works immediately after onboarding)
    const stored = localStorage.getItem('user_role') as UserRole | null;
    return stored;
  }, [isLoaded, user?.publicMetadata]);

  const permissions = useMemo(() => {
    if (!role) return [];
    return ROLE_PERMISSIONS[role] || [];
  }, [role]);

  const hasRole = useCallback((requiredRole: UserRole | UserRole[]): boolean => {
    if (!role) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(role);
  }, [role]);

  const can = useCallback((permission: string): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  }, [role]);

  const isAdmin = useMemo(() => role === ROLES.ADMIN, [role]);
  const isClinician = useMemo(() => role === ROLES.CLINICIAN, [role]);
  const isCHW = useMemo(() => role === ROLES.CHW, [role]);
  const isPatient = useMemo(() => role === ROLES.PATIENT, [role]);

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
