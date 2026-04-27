import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useRole } from '../../hooks/auth/useRole';
import { UserRole } from '../../lib/roles';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallbackPath?: string;
}

export function RequireRole({ children, allowedRoles, fallbackPath = '/onboarding' }: RequireRoleProps) {
  const { role, isLoading } = useRole();
  const location = useLocation();

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
