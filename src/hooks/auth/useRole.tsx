import { useAuth } from '@clerk/clerk-react';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { getRoleFromMetadata, ROLES, UserRole, hasPermission, ROLE_PERMISSIONS } from '../../lib/roles';

export function useRole() {
  const { user, isLoaded } = useAuth();

  // Local role state that can be set from localStorage immediately
  const [localRole, setLocalRole] = useState<UserRole | null>(() => {
    return localStorage.getItem('user_role') as UserRole | null;
  });

  // Sync with Clerk metadata when it arrives
  useEffect(() => {
    if (isLoaded && user) {
      const clerkRole = getRoleFromMetadata(user.publicMetadata);
      if (clerkRole) {
        setLocalRole(clerkRole);
        localStorage.setItem('user_role', clerkRole);
      }
    }
  }, [isLoaded, user]);

  const role = useMemo((): UserRole | null => {
    // Always trust locally cached role immediately — it was set during onboarding
    if (localRole) return localRole;

    // Fallback to Clerk metadata once loaded
    if (user && isLoaded) {
      return getRoleFromMetadata(user.publicMetadata);
    }

    return null;
  }, [user, isLoaded, localRole]);

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
    // Only truly loading on very first app load before we have any role info
    isLoading: (!isLoaded && !localRole),
  };
}
