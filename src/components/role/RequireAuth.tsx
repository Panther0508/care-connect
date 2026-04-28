import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, SignedIn } from '@clerk/clerk-react';
import LoadingFallback from '../LoadingFallback';

// Simple auth guard — just ensures user is signed in
export function RequireAuth({ children }: { children: React.ReactNode }) {
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
