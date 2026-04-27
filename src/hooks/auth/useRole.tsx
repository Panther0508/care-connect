import { useAuth } from '@clerk/clerk-react';
import { useMemo, useCallback } from 'react';
import { getRoleFromMetadata, ROLES, UserRole, hasPermission, ROLE_PERMISSIONS } from '../../lib/roles';

export function useRole() {
  const { user, isLoaded } = useAuth();

  const role = useMemo((): UserRole | null => {
    if (!user || !isLoaded) return null;
    return getRoleFromMetadata(user.publicMetadata);
  }, [user, isLoaded]);

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
    isLoading: !isLoaded,
  };
}
