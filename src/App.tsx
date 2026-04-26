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
import { useIDB } from "./hooks/useIDB";

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
  useSync();

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p>Initializing AI Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
          <Route path="/register-need" element={<PageWrapper><RegisterNeedPage /></PageWrapper>} />
          <Route path="/alerts" element={<PageWrapper><AlertsPage /></PageWrapper>} />
          <Route path="/reservation/:facilityId" element={<PageWrapper><ReservationPage /></PageWrapper>} />
          <Route path="/impact" element={<PageWrapper><ImpactPage /></PageWrapper>} />
          <Route path="/crisis-map" element={<PageWrapper><CrisisMapPage /></PageWrapper>} />
          <Route path="/facility/:id" element={<PageWrapper><FacilityDetailPage /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </AppLayout>
  );
};

export default App;