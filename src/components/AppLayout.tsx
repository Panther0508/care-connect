import { ReactNode, useEffect, useState } from "react";
import ModernBottomNav from "./ModernBottomNav";
import { OnlineStatusPill } from "./OnlineStatusPill";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { AnimatePresence, motion } from "framer-motion";
import { useStatus } from "../hooks/useStatus";
import OutbreakAlertNotifier from "./OutbreakAlertNotifier";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isOnline = useOnlineStatus();
  const { showStatus } = useStatus();

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

      <main className="relative z-10 pb-20 min-h-screen">
        <div className="mx-auto w-full max-w-5xl px-4 pt-8 md:px-8">
          {children}
        </div>
      </main>

      {/* Modern Bottom Navigation */}
      <ModernBottomNav />
    </div>
  );
}
