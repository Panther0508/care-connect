import { ReactNode, useEffect, useState } from "react";
import { OnlineStatusPill } from "./OnlineStatusPill";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { AnimatePresence, motion } from "framer-motion";
import { useStatus } from "../hooks/useStatus";
import OutbreakAlertNotifier from "./OutbreakAlertNotifier";
import { Menu, X } from "lucide-react";
import { useIDB } from "../hooks/useIDB";
import StatusToastContainer from "./StatusToastContainer";
import SideMenu from "./SideMenu";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isOnline = useOnlineStatus();
  const { showStatus } = useStatus();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
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
      <StatusToastContainer />

      {/* Global outbreak alert listener (no UI) */}
      <OutbreakAlertNotifier />

      {/* Side menu button (top-left) */}
      <button
        onClick={() => setSideMenuOpen(true)}
        className="fixed top-4 left-4 z-40 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white shadow-lg transition-all"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <main className={`relative z-10 min-h-screen pt-16`}>
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8">
          {children}
        </div>
      </main>

      {/* Side Menu */}
      <SideMenu open={sideMenuOpen} onOpenChange={setSideMenuOpen} />
    </div>
  );
}
