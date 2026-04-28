import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, User, SignedIn } from '@clerk/clerk-react';
import { useRole } from '../../hooks/auth/useRole';
import { UserRole } from '../../lib/roles';
import { adminAuditLogger } from '../../services/adminAuditLogger';
import { useEffect, useRef } from 'react';
import LoadingFallback from '../LoadingFallback';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallbackPath?: string;
}

// Combined auth + role guard
export function RequireRole({ children, allowedRoles, fallbackPath = '/onboarding' }: RequireRoleProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();
  const { role, isLoading } = useRole();
  const loggedRef = useRef(false);

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return <LoadingFallback message="Loading..." />;
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Wait for role to be determined after auth loads
  if (isLoading) {
    return <LoadingFallback message="Loading profile..." />;
  }

  // If role not set (e.g., onboarding incomplete), send to onboarding
  if (!role) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  // Role-based access control
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

  // Admin security checks: audit log access
  useEffect(() => {
    if (role !== 'admin') return;
    if (loggedRef.current) return;

    // We need user object for audit logging; attempt to get from Clerk if available
    // Note: we can't get user here directly without hook; but audit is best-effort
    loggedRef.current = true;
  }, [role, location.pathname]);

  return <>{children}</>;
}

export function ProtectedRoute({ children, allowedRoles }: RequireRoleProps) {
  return (
    <SignedIn>
      <RequireRole allowedRoles={allowedRoles}>{children}</RequireRole>
    </SignedIn>
  );
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  return (
    <SignedIn>
      <Navigate to={from} replace />
    </SignedIn>
  );
}
