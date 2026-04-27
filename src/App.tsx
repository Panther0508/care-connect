import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";

// Layout & Components
import AppLayout from "./components/AppLayout";
import { useOfflineAuth } from "./hooks/auth/useOfflineAuth";
import { useRole } from "./hooks/auth/useRole";
import LoadingFallback from "./components/LoadingFallback";

// Auth Guards
import { ProtectedRoute, PublicOnlyRoute } from "./components/role/RequireRole";

// Lazy-loaded pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const SignInPage = lazy(() => import("./pages/auth/SignInPage"));
const SignUpPage = lazy(() => import("./pages/auth/SignUpPage"));
const Onboarding = lazy(() => import("./pages/onboarding"));
const PatientDashboard = lazy(() => import("./pages/dashboards/PatientDashboard"));
const ClinicianDashboard = lazy(() => import("./pages/dashboards/ClinicianDashboard"));
const CHWDashboard = lazy(() => import("./pages/dashboards/CHWDashboard"));
const AdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard"));
const HomePage = lazy(() => import("./pages/HomePage"));
const HealthGraph = lazy(() => import("./pages/HealthGraph"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Passport = lazy(() => import("./pages/Passport"));
const ClinicianView = lazy(() => import("./pages/ClinicianView"));
const OutbreakDashboard = lazy(() => import("./pages/OutbreakDashboard"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const RegisterNeedPage = lazy(() => import("./pages/RegisterNeedPage"));
const ReservationPage = lazy(() => import("./pages/ReservationPage"));
const ImpactPage = lazy(() => import("./pages/ImpactPage"));
const CrisisMapPage = lazy(() => import("./pages/CrisisMapPage"));
const FacilityDetailPage = lazy(() => import("./pages/FacilityDetailPage"));
const Settings = lazy(() => import("./pages/Settings"));
const Support = lazy(() => import("./pages/Support"));
const LanguageSelector = lazy(() => import("./pages/LanguageSelector"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Referral = lazy(() => import("./pages/Referral"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const AdminMFAGate = lazy(() => import("./components/AdminMFAGate"));
const AdminBiometricLock = lazy(() => import("./components/AdminBiometricLock"));

// Page wrapper with animation
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

// Role-based dashboard switcher
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

  if (!isLoaded) {
    return <LoadingFallback message="Loading VitaChain..." showProgress />;
  }

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          {/* Onboarding */}
          <Route
            path="/onboarding"
            element={
              <SignedIn>
                <Onboarding />
              </SignedIn>
            }
          />

          {/* Dashboard */}
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

          {/* Protected pages */}
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

          {/* Settings & support */}
          <Route path="/settings" element={<SignedIn><PageWrapper><Settings /></PageWrapper></SignedIn>} />
          <Route path="/subscription" element={<SignedIn><PageWrapper><Subscription /></PageWrapper></SignedIn>} />
          <Route path="/referral" element={<SignedIn><PageWrapper><Referral /></PageWrapper></SignedIn>} />
          <Route path="/support" element={<SignedIn><PageWrapper><Support /></PageWrapper></SignedIn>} />
          <Route path="/language" element={<SignedIn><PageWrapper><LanguageSelector /></PageWrapper></SignedIn>} />

          {/* Admin routes with security layers */}
          <Route
            path="/admin"
            element={
              <SignedIn>
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminMFAGate>
                      <AdminBiometricLock>
                        <PageWrapper><AdminDashboard /></PageWrapper>
                      </AdminBiometricLock>
                    </AdminMFAGate>
                  </Suspense>
                </ProtectedRoute>
              </SignedIn>
            }
          />
          <Route
            path="/audit-log"
            element={
              <SignedIn>
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminMFAGate>
                      <AdminBiometricLock>
                        <PageWrapper><AuditLog /></PageWrapper>
                      </AdminBiometricLock>
                    </AdminMFAGate>
                  </Suspense>
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