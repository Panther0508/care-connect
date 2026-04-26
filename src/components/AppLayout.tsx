import { ReactNode, useEffect, useState } from "react";
import { BottomNav } from "./Navigation";
import { OnlineStatusPill } from "./OnlineStatusPill";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { AnimatePresence, motion } from "framer-motion";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isOnline = useOnlineStatus();
  const [toast, setToast] = useState<{ message: string; type: "online" | "offline" } | null>(null);

  useEffect(() => {
    // Only show toast when state explicitly changes after initial mount
    const handleOnline = () => {
      setToast({ message: "Back online — syncing latest facility data", type: "online" });
      setTimeout(() => setToast(null), 3000);
    };
    const handleOffline = () => {
      setToast({ message: "You're offline — CareSentinel is still watching", type: "offline" });
      setTimeout(() => setToast(null), 3000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`min-h-screen w-full relative transition-all duration-500 overflow-hidden ${!isOnline ? "shadow-[inset_0_0_100px_rgba(245,158,11,0.05)]" : ""}`}>
      {/* Premium Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -50, 0], 
            y: [0, 100, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            x: [0, 20, 0], 
            y: [0, -80, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-amber-500/5 blur-[80px]"
        />
      </div>

      <OnlineStatusPill />

      <main className="pb-20 min-h-screen w-full">
        <div className="mx-auto w-full max-w-5xl px-4 pt-8 md:px-8">
          {children}
        </div>
      </main>

      <BottomNav />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-medium border shadow-lg whitespace-nowrap ${
              toast.type === "online" 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
