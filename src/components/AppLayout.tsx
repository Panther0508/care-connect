import { ReactNode, useEffect, useState } from "react";
import ModernBottomNav from "./ModernBottomNav";
import { OnlineStatusPill } from "./OnlineStatusPill";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { AnimatePresence, motion } from "framer-motion";
import { useStatus } from "../hooks/useStatus";
import OutbreakAlertNotifier from "./OutbreakAlertNotifier";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useIDB } from "../hooks/useIDB";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isOnline = useOnlineStatus();
  const { showStatus } = useStatus();
  const [footerVisible, setFooterVisible] = useState(true);
  // Initialize offline data and mesh orchestrator globally
  const { ready: idbReady } = useIDB();

  useEffect(() => {
    const handleOnline = () => {
      showStatus('success', 'Back Online', 'Syncing latest health data...');
    };
    const handleOffline = () => {
      showStatus('offline', 'You Are Offline', 'VitaChain is still guarding your health. Your data stays private.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showStatus]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* ... existing orbs ... */}
      </div>

      <OnlineStatusPill />

      {/* Global outbreak alert listener (no UI) */}
      <OutbreakAlertNotifier />

      <main className={`relative z-10 min-h-screen ${footerVisible ? 'pb-20' : 'pb-0'}`}>
        <div className="mx-auto w-full max-w-5xl px-4 pt-8 md:px-8">
          {children}
        </div>
      </main>

      {/* Footer toggle button */}
      <button
        onClick={() => setFooterVisible(v => !v)}
        className="fixed bottom-4 right-4 z-50 p-2 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-lg transition-colors"
        aria-label={footerVisible ? "Hide navigation" : "Show navigation"}
      >
        {footerVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>

      {/* Modern Bottom Navigation with animation */}
      <AnimatePresence>
        {footerVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <ModernBottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
