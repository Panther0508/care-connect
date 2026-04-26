import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { AnimatePresence, motion } from "framer-motion";

export function OnlineStatusPill() {
  const isOnline = useOnlineStatus();

  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence mode="wait">
        {isOnline ? (
          <motion.div
            key="online"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 text-xs flex items-center gap-1"
          >
            <span>●</span>
            <span>Online</span>
          </motion.div>
        ) : (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-3 py-1 text-xs flex items-center gap-1"
          >
            <span>●</span>
            <span>Offline</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
