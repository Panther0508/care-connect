import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "./components/AppLayout";
import { useOfflineAuth } from "./hooks/auth/useOfflineAuth";
import { useRole } from "./hooks/auth/useRole";

// Auth Pages
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";

// Public
import Landing from "./pages/Landing";

// Protected Pages
import Onboarding from "./pages/onboarding";
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import ClinicianDashboard from "./pages/dashboards/ClinicianDashboard";
import CHWDashboard from "./pages/dashboards/CHWDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";

// Existing Pages
import HomePage from "./pages/HomePage";
import HealthGraph from "./pages/HealthGraph";
import AIAssistant from "./pages/AIAssistant";
import Passport from "./pages/Passport";
import ClinicianView from "./pages/ClinicianView";
import OutbreakDashboard from "./pages/OutbreakDashboard";
import AlertsPage from "./pages/AlertsPage";
import ReservationPage from "./pages/ReservationPage";
import ImpactPage from "./pages/ImpactPage";
import CrisisMapPage from "./pages/CrisisMapPage";
import FacilityDetailPage from "./pages/FacilityDetailPage";
import RegisterNeedPage from "./pages/RegisterNeedPage";

// Settings & Support
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import LanguageSelector from "./pages/LanguageSelector";
import Subscription from "./pages/Subscription";
import Referral from "./pages/Referral";

// Admin
import AuditLog from "./pages/AuditLog";
import AdminMFAGate from "./components/AdminMFAGate";
import AdminBiometricLock from "./components/AdminBiometricLock";

// Auth Guards
import { ProtectedRoute, PublicOnlyRoute } from "./components/role/RequireRole";

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

// Simple loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      <p>App is initializing...</p>
    </div>
  </div>
);

// Component that redirects to appropriate dashboard based on role
function RoleBasedDashboard() {
  const { role } = useRole();

  if (!role) {
    return <Navigate to="/onboarding" replace />;
  }

  switch (role) {
    case 'patient':
      return <PatientDashboard />;
    case 'clinician':
      return <ClinicianDashboard />;
    case 'chw':
      return <CHWDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/" replace />;
  }
}

const App = () => {
  const location = useLocation();
  const { isLoaded } = useAuth();

  // Show loading until Clerk is ready
  if (!isLoaded) {
    return <LoadingFallback />;
  }

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          {/* Onboarding - signed in but not completed */}
          <Route
            path="/onboarding"
            element={
              <SignedIn>
                <Onboarding />
              </SignedIn>
            }
          />

          {/* Protected routes for signed-in users */}
          <Route
            path="/dashboard"
            element={
              <SignedIn>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                  <RoleBasedDashboard />
                </ProtectedRoute>
              </SignedIn>
            }
          />

          {/* Existing protected routes */}
          <Route
            path="/health"
            element={
              <SignedIn>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw']}>
                  <PageWrapper><HealthGraph /></PageWrapper>
                </ProtectedRoute>
              </SignedIn>
            }
          />

          <Route
            path="/ai"
            element={
              <SignedIn>
                <ProtectedRoute allowedRoles={['patient', 'clinician']}>
                  <PageWrapper><AIAssistant /></PageWrapper>
                </ProtectedRoute>
              </SignedIn>
            }
          />

          <Route
            path="/passport"
            element={
              <SignedIn>
                <ProtectedRoute allowedRoles={['patient', 'chw']}>
                  <PageWrapper><Passport /></PageWrapper>
                </ProtectedRoute>
              </SignedIn>
            }
          />

          <Route
            path="/clinician-view"
            element={
              <SignedIn>
                <ProtectedRoute allowedRoles={['clinician']}>
                  <PageWrapper><ClinicianView /></PageWrapper>
                </ProtectedRoute>
              </SignedIn>
            }
          />

          <Route
            path="/outbreak"
            element={
              <SignedIn>
                <ProtectedRoute allowedRoles={['chw', 'admin']}>
                  <PageWrapper><OutbreakDashboard /></PageWrapper>
                </ProtectedRoute>
              </SignedIn>
            }
          />

          {/* Generic routes */}
          <Route
            path="/register-need"
            element={
              <SignedIn>
                <PageWrapper><RegisterNeedPage /></PageWrapper>
              </SignedIn>
            }
          />

          <Route
            path="/alerts"
            element={
              <SignedIn>
                <PageWrapper><AlertsPage /></PageWrapper>
              </SignedIn>
            }
          />

          <Route
            path="/reservation/:facilityId"
            element={
              <SignedIn>
                <PageWrapper><ReservationPage /></PageWrapper>
              </SignedIn>
            }
          />

          <Route
            path="/impact"
            element={
              <SignedIn>
                <PageWrapper><ImpactPage /></PageWrapper>
              </SignedIn>
            }
          />

          <Route
            path="/crisis-map"
            element={
              <SignedIn>
                <PageWrapper><CrisisMapPage /></PageWrapper>
              </SignedIn>
            }
          />

          <Route
            path="/facility/:id"
            element={
              <SignedIn>
                <PageWrapper><FacilityDetailPage /></PageWrapper>
              </SignedIn>
            }
          />

          {/* Settings & related */}
          <Route
            path="/settings"
            element={
              <SignedIn>
                <PageWrapper><Settings /></PageWrapper>
              </SignedIn>
            }
          />

          <Route
            path="/subscription"
            element={
              <SignedIn>
                <PageWrapper><Subscription /></PageWrapper>
              </SignedIn>
            }
          />

          <Route
            path="/referral"
            element={
              <SignedIn>
                <PageWrapper><Referral /></PageWrapper>
              </SignedIn>
            }
          />

          <Route
            path="/support"
            element={
              <SignedIn>
                <PageWrapper><Support /></PageWrapper>
              </SignedIn>
            }
          />

          <Route
            path="/language"
            element={
              <SignedIn>
                <PageWrapper><LanguageSelector /></PageWrapper>
              </SignedIn>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <SignedIn>
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMFAGate>
                    <AdminBiometricLock>
                      <PageWrapper><AdminDashboard /></PageWrapper>
                    </AdminBiometricLock>
                  </AdminMFAGate>
                </ProtectedRoute>
              </SignedIn>
            }
          />

          <Route
            path="/audit-log"
            element={
              <SignedIn>
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMFAGate>
                    <AdminBiometricLock>
                      <PageWrapper><AuditLog /></PageWrapper>
                    </AdminBiometricLock>
                  </AdminMFAGate>
                </ProtectedRoute>
              </SignedIn>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AppLayout>
  );
};

export default App;
