import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";

// Layout & Components
import AppLayout from "./components/AppLayout";
import LoadingFallback from "./components/LoadingFallback";
import { useRole } from "./hooks/auth/useRole";
import { ProtectedRoute } from "./components/role/RequireRole";
import { RequireAuth } from "./components/role/RequireAuth";

// Lazy-loaded pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const SignInPage = lazy(() => import("./pages/auth/SignInPage"));
const SignUpPage = lazy(() => import("./pages/auth/SignUpPage"));
const Onboarding = lazy(() => import("./pages/onboarding"));
const PatientDashboard = lazy(() => import("./pages/dashboards/PatientDashboard"));
const ClinicianDashboard = lazy(() => import("./pages/dashboards/ClinicianDashboard"));
const CHWDashboard = lazy(() => import("./pages/dashboards/CHWDashboard"));
const AdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard"));
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
const PageWrapper = ({ children }) => (
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
      <Suspense fallback={<LoadingFallback message="Loading page..." />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />

            {/* Onboarding — requires auth only, no role needed */}
            <Route path="/onboarding" element={
              <RequireAuth>
                <Onboarding />
              </RequireAuth>
            } />

            {/* Dashboard — requires auth + role */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                <RoleBasedDashboard />
              </ProtectedRoute>
            } />

            {/* Protected pages — all require role */}
            <Route path="/health" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw']}>
                <PageWrapper><HealthGraph /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/ai" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician']}>
                <PageWrapper><AIAssistant /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/passport" element={
              <ProtectedRoute allowedRoles={['patient', 'chw']}>
                <PageWrapper><Passport /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/clinician-view" element={
              <ProtectedRoute allowedRoles={['clinician']}>
                <PageWrapper><ClinicianView /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/outbreak" element={
              <ProtectedRoute allowedRoles={['chw', 'admin']}>
                <PageWrapper><OutbreakDashboard /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/register-need" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                <PageWrapper><RegisterNeedPage /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/alerts" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw']}>
                <PageWrapper><AlertsPage /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/reservation/:facilityId" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                <PageWrapper><ReservationPage /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/impact" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                <PageWrapper><ImpactPage /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/crisis-map" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                <PageWrapper><CrisisMapPage /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/facility/:id" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                <PageWrapper><FacilityDetailPage /></PageWrapper>
              </ProtectedRoute>
            } />

            {/* Settings & support */}
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                <PageWrapper><Settings /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/subscription" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                <PageWrapper><Subscription /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/referral" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                <PageWrapper><Referral /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                <PageWrapper><Support /></PageWrapper>
              </ProtectedRoute>
            } />
            <Route path="/language" element={
              <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                <PageWrapper><LanguageSelector /></PageWrapper>
              </ProtectedRoute>
            } />

            {/* Admin routes with security layers */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminMFAGate>
                    <AdminBiometricLock>
                      <PageWrapper><AdminDashboard /></PageWrapper>
                    </AdminBiometricLock>
                  </AdminMFAGate>
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/audit-log" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminMFAGate>
                    <AdminBiometricLock>
                      <PageWrapper><AuditLog /></PageWrapper>
                    </AdminBiometricLock>
                  </AdminMFAGate>
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </AppLayout>
  );
};

export default App;
