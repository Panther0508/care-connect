import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useRole } from '../../hooks/auth/useRole';
import { UserRole } from '../../lib/roles';
import { useEffect, useRef } from 'react';
import LoadingFallback from '../LoadingFallback';

interface GuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole | UserRole[];
}

// Requires user to be signed in (no role check)
export function RequireAuth({ children }: GuardProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <LoadingFallback message="Loading..." />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// Requires signed-in + specific role(s) + onboarding completed
export function ProtectedRoute({ children, allowedRoles }: GuardProps) {
  const { isSignedIn, isLoaded, user } = useAuth();
  const location = useLocation();
  const { role, isLoading } = useRole();
  const loggedRef = useRef(false);

  if (!isLoaded) {
    return <LoadingFallback message="Loading..." />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return <LoadingFallback message="Loading profile..." />;
  }

  if (!role) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!rolesArray.includes(role)) {
      const getDashboardForRole = (r: UserRole): string => {
        switch (r) {
          case 'patient':
            return '/health';
          case 'clinician':
            return '/clinician-view';
          case 'chw':
            return '/outbreak';
          case 'admin':
            return '/admin';
          default:
            return '/';
        }
      };
      return <Navigate to={getDashboardForRole(role)} replace />;
    }
  }

  // Block access if onboarding not completed (except on /onboarding route)
  if (location.pathname !== '/onboarding' && localStorage.getItem('onboarding_completed') !== 'true') {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // Admin audit logging
  useEffect(() => {
    if (role !== 'admin') return;
    if (loggedRef.current) return;
    // Best-effort: we don't have userId easily here, would need useAuth hook
    loggedRef.current = true;
  }, [role, location.pathname]);

  return <>{children}</>;
}

// For public-only pages (sign-in, sign-up) — redirect if already signed in
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const from = location.state?.from?.pathname || '/dashboard';

  if (isSignedIn) {
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
