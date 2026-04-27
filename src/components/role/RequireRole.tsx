import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useRole } from '../../hooks/auth/useRole';
import { UserRole } from '../../lib/roles';
import { adminAuditLogger } from '../../services/adminAuditLogger';
import { useEffect, useRef } from 'react';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallbackPath?: string;
}

export function RequireRole({ children, allowedRoles, fallbackPath = '/onboarding' }: RequireRoleProps) {
  const { role, isLoading } = useRole();
  const location = useLocation();
  const { user } = useAuth();
  const loggedRef = useRef(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

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

  // Admin security checks: audit log access
  useEffect(() => {
    if (!user || !role) return;
    if (role !== 'admin') return;
    if (loggedRef.current) return;

    adminAuditLogger.log(
      user.id,
      'route.access',
      `admin_route:${location.pathname}`,
      { pathname: location.pathname, allowedRoles: rolesArray },
      user.publicMetadata?.did
    );

    loggedRef.current = true;
  }, [user, role, location.pathname, rolesArray]);

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
