import { ReactNode, useEffect, useState } from "react";
import ModernBottomNav from "./ModernBottomNav";
import { OnlineStatusPill } from "./OnlineStatusPill";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { AnimatePresence, motion } from "framer-motion";
import { useStatus } from "../hooks/useStatus";

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
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 100, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[30%] -right-[20%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -80, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[80px]"
        />
      </div>

      <OnlineStatusPill />

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
