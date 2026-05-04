import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { UserRole } from '../../lib/roles';
import LoadingFallback from '../LoadingFallback';

interface GuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole | UserRole[];
}

// Session verification gate — prevents access until Clerk metadata is synced, but allows localStorage role bypass
export function AuthSyncGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isSignedIn) {
    return <>{children}</>;
  }

  // If we have a role in localStorage, we trust onboarding is complete — bypass Clerk loading state
  const storedRole = localStorage.getItem('user_role') as UserRole | null;
  if (storedRole) {
    return <>{children}</>;
  }

  // No localStorage role yet → show verifying screen while Clerk loads
  if (!isLoaded) {
    return <LoadingFallback message="Verifying your session..." />;
  }

  return <>{children}</>;
}

// Requires user to be signed in (no role check)
export function RequireAuth({ children }: GuardProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  // DEV ONLY: ?devBypass=true skips auth for local testing
  if (import.meta.env?.DEV && new URLSearchParams(location.search).has('devBypass')) {
    return <>{children}</>;
  }

  if (!isLoaded) {
    return <LoadingFallback message="Loading..." />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// Requires signed-in + specific role(s) — uses immediate localStorage read
export function ProtectedRoute({ children, allowedRoles }: GuardProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  // DEV ONLY: ?devBypass=true skips auth for local testing
  if (import.meta.env?.DEV && new URLSearchParams(location.search).has('devBypass')) {
    if (!localStorage.getItem('user_role')) {
      localStorage.setItem('user_role', allowedRoles ? (Array.isArray(allowedRoles) ? allowedRoles[0] : allowedRoles) : 'patient');
    }
    return <>{children}</>;
  }

  if (!isLoaded) {
    return <LoadingFallback message="Loading..." />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Immediate synchronous read from localStorage — always up-to-date
  const storedRole = localStorage.getItem('user_role') as UserRole | null;

  // If no storedRole, and we're already on onboarding, don't redirect (prevents loops)
  if (!storedRole && location.pathname.startsWith('/onboarding')) {
    return <>{children}</>;
  }

  if (!storedRole) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!rolesArray.includes(storedRole)) {
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
    return <Navigate to={getDashboardForRole(storedRole)} replace />;
  }

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
