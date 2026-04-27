import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import RegisterNeedPage from "./pages/RegisterNeedPage";
import AlertsPage from "./pages/AlertsPage";
import ReservationPage from "./pages/ReservationPage";
import ImpactPage from "./pages/ImpactPage";
import CrisisMapPage from "./pages/CrisisMapPage";
import FacilityDetailPage from "./pages/FacilityDetailPage";
import OutbreakDashboard from "./pages/OutbreakDashboard";
import HealthGraph from "./pages/HealthGraph";
import AIAssistant from "./pages/AIAssistant";
import Passport from "./pages/Passport";
import ClinicianView from "./pages/ClinicianView";
import { useIDB } from "./hooks/useIDB";
import { initMeshOrchestrator } from "./services/meshOrchestrator";
import { useEffect, useRef } from "react";
import { StatusProvider } from "./context/StatusContext";
import { StatusToastContainer } from "./components/StatusToast";
import { useStatus } from "./hooks/useStatus";

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

const App = () => {
  const location = useLocation();
  const { ready } = useIDB();

  useEffect(() => {
    if (ready) {
      initMeshOrchestrator().catch(console.error);
    }
  }, [ready]);

  return (
    <StatusProvider>
      <AppContent ready={ready} />
    </StatusProvider>
  );
};

const AppContent = ({ ready }: { ready: boolean }) => {
  const location = useLocation();
  const { showStatus, dismissStatus } = useStatus();
  const loaderToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready && !loaderToastRef.current) {
      loaderToastRef.current = showStatus(
        'loading', 
        'Initializing AI Engine', 
        'This only happens once. The model will work offline after download.',
        { duration: 0 }
      );
    } else if (ready && loaderToastRef.current) {
      dismissStatus(loaderToastRef.current);
      loaderToastRef.current = null;
    }
  }, [ready, showStatus, dismissStatus]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <StatusToastContainer />
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p>Preparing environment...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <StatusToastContainer />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
          <Route path="/health" element={<PageWrapper><HealthGraph /></PageWrapper>} />
          <Route path="/ai" element={<PageWrapper><AIAssistant /></PageWrapper>} />
          <Route path="/passport" element={<PageWrapper><Passport /></PageWrapper>} />
          <Route path="/clinician-view" element={<PageWrapper><ClinicianView /></PageWrapper>} />
          <Route path="/register-need" element={<PageWrapper><RegisterNeedPage /></PageWrapper>} />
          <Route path="/alerts" element={<PageWrapper><AlertsPage /></PageWrapper>} />
          <Route path="/reservation/:facilityId" element={<PageWrapper><ReservationPage /></PageWrapper>} />
          <Route path="/impact" element={<PageWrapper><ImpactPage /></PageWrapper>} />
          <Route path="/crisis-map" element={<PageWrapper><CrisisMapPage /></PageWrapper>} />
          <Route path="/facility/:id" element={<PageWrapper><FacilityDetailPage /></PageWrapper>} />
          <Route path="/outbreak" element={<PageWrapper><OutbreakDashboard /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </AppLayout>
  );
};

export default App;
