import { useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRoleFromMetadata, ROLES, UserRole, hasPermission, ROLE_PERMISSIONS } from '../../lib/roles';

export function useRole() {
  const { user, isLoaded } = useAuth();

  // IMMEDIATE synchronous read from localStorage — always available
  const localStorageRole = (localStorage.getItem('user_role') as UserRole) || null;

  // Clerk-based role (may be null initially)
  const clerkRole = isLoaded && user ? getRoleFromMetadata(user.publicMetadata) : null;

  // Final role: prefer Clerk if available, fall back to localStorage
  const role = clerkRole || localStorageRole;

  // Background sync: whenever Clerk loads with a role that differs from localStorage, update localStorage
  useEffect(() => {
    if (isLoaded && user && clerkRole && clerkRole !== localStorageRole) {
      localStorage.setItem('user_role', clerkRole);
    }
  }, [isLoaded, user, clerkRole, localStorageRole]);

  const permissions = role ? (ROLE_PERMISSIONS[role] || []) : [];

  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!role) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(role);
  };

  const can = (permission: string): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

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
    isLoading: false, // Always false — we always have a role from localStorage or Clerk
  };
}
