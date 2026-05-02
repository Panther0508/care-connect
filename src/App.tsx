import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";

// Layout & Components
import AppLayout from "./components/AppLayout";
import LoadingFallback from "./components/LoadingFallback";
import { useRole } from "./hooks/auth/useRole";
import { ProtectedRoute, RequireAuth, AuthSyncGate } from "./components/role/RequireRole";

// Lazy-loaded pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const SignInPage = lazy(() => import("./pages/auth/SignInPage"));
const SignUpPage = lazy(() => import("./pages/auth/SignUpPage"));
const Onboarding = lazy(() => import("./pages/onboarding"));
const PatientDashboard = lazy(() => import("./pages/dashboards/PatientDashboard"));
const ClinicianDashboard = lazy(() => import("./pages/dashboards/ClinicianDashboard"));
const CHWDashboard = lazy(() => import("./pages/dashboards/CHWDashboard"));
const AdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard"));
const ClinicianProfile = lazy(() => import("./pages/ClinicianProfile"));
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

// New wellness pages
const Nutrition = lazy(() => import("./pages/Nutrition"));
const Workout = lazy(() => import("./pages/Workout"));
const WorkoutHistory = lazy(() => import("./pages/WorkoutHistory"));
const CycleTracker = lazy(() => import("./pages/CycleTracker"));
const Hydration = lazy(() => import("./pages/Hydration"));
const Sleep = lazy(() => import("./pages/Sleep"));
const Medications = lazy(() => import("./pages/Medications"));
const Calculators = lazy(() => import("./pages/Calculators"));
const MentalHealth = lazy(() => import("./pages/MentalHealth"));
const EducationPage = lazy(() => import("./pages/EducationPage"));
const EducationModule = lazy(() => import("./components/EducationModule"));
const FirstAid = lazy(() => import("./pages/FirstAid"));
// Community pages
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const TopicFeed = lazy(() => import("./pages/TopicFeed"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const PatientHistory = lazy(() => import("./pages/PatientHistory"));
const ReferralGenerator = lazy(() => import("./pages/ReferralGenerator"));
const CHWTriage = lazy(() => import("./pages/CHWTriage"));
const ProtocolNavigator = lazy(() => import("./pages/ProtocolNavigator"));
const EncounterLogger = lazy(() => import("./pages/EncounterLogger"));
const EmergencyID = lazy(() => import("./pages/EmergencyID"));
const RewardsPage = lazy(() => import("./pages/RewardsPage"));
const QuestsPage = lazy(() => import("./pages/QuestsPage"));
const TrainingDashboard = lazy(() => import("./pages/TrainingDashboard"));
const EvaluationDashboard = lazy(() => import("./pages/EvaluationDashboard"));

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
  const { role: hookRole } = useRole();
  const location = useLocation();

  // Immediate fallback to localStorage if hook returns null
  const storedRole = localStorage.getItem('user_role');
  const role = hookRole || storedRole;

  // If already on onboarding, don't redirect (prevents loops)
  if (!role && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!role) {
    return <Navigate to="/" replace />;
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
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                   <RoleBasedDashboard />
                 </ProtectedRoute>
               </AuthSyncGate>
             } />

             {/* Clinician Professional Profile */}
             <Route path="/clinician/profile" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['clinician']}>
                   <PageWrapper><ClinicianProfile /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
              } />

              {/* Referral Generator for Clinicians */}
              <Route path="/referral-generator" element={
                <AuthSyncGate>
                  <ProtectedRoute allowedRoles={['clinician']}>
                    <PageWrapper><ReferralGenerator /></PageWrapper>
                  </ProtectedRoute>
                </AuthSyncGate>
              } />

             {/* Protected pages — all require role */}
             <Route path="/health" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw']}>
                  <PageWrapper><HealthGraph /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
             <Route path="/ai" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient', 'clinician']}>
                   <PageWrapper><AIAssistant /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />

             {/* Patient wellness routes */}
             <Route path="/nutrition" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient']}>
                   <PageWrapper><Nutrition /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
             <Route path="/workout" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient']}>
                   <PageWrapper><Workout /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
             <Route path="/workout-history" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient']}>
                   <PageWrapper><WorkoutHistory /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
             <Route path="/cycle" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient']}>
                   <PageWrapper><CycleTracker /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
             <Route path="/water" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient']}>
                   <PageWrapper><Hydration /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
             <Route path="/sleep" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient']}>
                   <PageWrapper><Sleep /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
             <Route path="/medications" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient']}>
                   <PageWrapper><Medications /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
             <Route path="/calculators" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient']}>
                   <PageWrapper><Calculators /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
              <Route path="/mental-health" element={
                <AuthSyncGate>
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PageWrapper><MentalHealth /></PageWrapper>
                  </ProtectedRoute>
                </AuthSyncGate>
               } />
               
               {/* Patient engagement: Rewards & Quests */}
               <Route path="/rewards" element={
                 <AuthSyncGate>
                   <ProtectedRoute allowedRoles={['patient']}>
                     <PageWrapper><RewardsPage /></PageWrapper>
                   </ProtectedRoute>
                 </AuthSyncGate>
               } />
               <Route path="/quests" element={
                 <AuthSyncGate>
                   <ProtectedRoute allowedRoles={['patient']}>
                     <PageWrapper><QuestsPage /></PageWrapper>
                   </ProtectedRoute>
                 </AuthSyncGate>
               } />
               
               {/* Education routes */}
               <Route path="/education" element={
                <AuthSyncGate>
                  <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                    <PageWrapper><EducationPage /></PageWrapper>
                  </ProtectedRoute>
                </AuthSyncGate>
              } />
              <Route path="/education/:moduleId" element={
                <AuthSyncGate>
                  <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                    <PageWrapper><EducationModule /></PageWrapper>
                  </ProtectedRoute>
                </AuthSyncGate>
               } />
               
               {/* Patient health history */}
               <Route path="/patient-history" element={
                 <AuthSyncGate>
                   <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                     <PageWrapper><PatientHistory /></PageWrapper>
                   </ProtectedRoute>
                 </AuthSyncGate>
               } />
               
                {/* Care Locator route */}
                <Route path="/care-locator" element={
                 <AuthSyncGate>
                   <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                     <PageWrapper><CareLocator /></PageWrapper>
                   </ProtectedRoute>
                 </AuthSyncGate>
               } />

               {/* Community Health routes - patient only */}
               <Route path="/community" element={
                 <AuthSyncGate>
                   <ProtectedRoute allowedRoles={['patient']}>
                     <PageWrapper><CommunityPage /></PageWrapper>
                   </ProtectedRoute>
                 </AuthSyncGate>
               } />
               <Route path="/topic/:topicId" element={
                 <AuthSyncGate>
                   <ProtectedRoute allowedRoles={['patient']}>
                     <PageWrapper><TopicFeed /></PageWrapper>
                   </ProtectedRoute>
                 </AuthSyncGate>
               } />
               <Route path="/post/:postId" element={
                 <AuthSyncGate>
                   <ProtectedRoute allowedRoles={['patient']}>
                     <PageWrapper><PostDetail /></PageWrapper>
                   </ProtectedRoute>
                 </AuthSyncGate>
               } />

               <Route path="/first-aid" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient']}>
                   <PageWrapper><FirstAid /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
              } />
              
              {/* Emergency Medical ID - accessible to all roles */}
             <Route path="/emergency" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                   <PageWrapper><EmergencyID /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
             
             <Route path="/passport" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'chw']}>
                  <PageWrapper><Passport /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/clinician-view" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['clinician']}>
                  <PageWrapper><ClinicianView /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/outbreak" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['chw', 'admin']}>
                  <PageWrapper><OutbreakDashboard /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/register-need" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                  <PageWrapper><RegisterNeedPage /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/alerts" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw']}>
                  <PageWrapper><AlertsPage /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
             } />
             
             {/* CHW specific routes */}
             <Route path="/chw-triage" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['chw']}>
                   <PageWrapper><CHWTriage /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
             <Route path="/protocol-navigator" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['chw']}>
                   <PageWrapper><ProtocolNavigator /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
             <Route path="/encounter-logger" element={
               <AuthSyncGate>
                 <ProtectedRoute allowedRoles={['chw']}>
                   <PageWrapper><EncounterLogger /></PageWrapper>
                 </ProtectedRoute>
               </AuthSyncGate>
             } />
             
             <Route path="/reservation/:facilityId" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                  <PageWrapper><ReservationPage /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/impact" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                  <PageWrapper><ImpactPage /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/crisis-map" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                  <PageWrapper><CrisisMapPage /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/facility/:id" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                  <PageWrapper><FacilityDetailPage /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />

            {/* Settings & support */}
            <Route path="/settings" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                  <PageWrapper><Settings /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/subscription" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                  <PageWrapper><Subscription /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/referral" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                  <PageWrapper><Referral /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/support" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                  <PageWrapper><Support /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/language" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['patient', 'clinician', 'chw', 'admin']}>
                  <PageWrapper><LanguageSelector /></PageWrapper>
                </ProtectedRoute>
              </AuthSyncGate>
            } />

            {/* Admin routes with security layers */}
            <Route path="/admin" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminMFAGate>
                      <AdminBiometricLock>
                        <PageWrapper><AdminDashboard /></PageWrapper>
                      </AdminBiometricLock>
                    </AdminMFAGate>
                  </Suspense>
                </ProtectedRoute>
              </AuthSyncGate>
            } />
            <Route path="/audit-log" element={
              <AuthSyncGate>
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminMFAGate>
                      <AdminBiometricLock>
                        <PageWrapper><AuditLog /></PageWrapper>
                      </AdminBiometricLock>
                    </AdminMFAGate>
                  </Suspense>
                </ProtectedRoute>
              </AuthSyncGate>
             } />
              <Route path="/training" element={
                <AuthSyncGate>
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminMFAGate>
                        <AdminBiometricLock>
                          <PageWrapper><TrainingDashboard /></PageWrapper>
                        </AdminBiometricLock>
                      </AdminMFAGate>
                    </Suspense>
                  </ProtectedRoute>
                </AuthSyncGate>
              } />
              <Route path="/evaluation" element={
                <AuthSyncGate>
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminMFAGate>
                        <AdminBiometricLock>
                          <PageWrapper><EvaluationDashboard /></PageWrapper>
                        </AdminBiometricLock>
                      </AdminMFAGate>
                    </Suspense>
                  </ProtectedRoute>
                </AuthSyncGate>
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
