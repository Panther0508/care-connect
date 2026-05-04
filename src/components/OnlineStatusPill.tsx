import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import VitaAvatar from "./VitaAvatar";
import { Link } from "react-router-dom";

export function OnlineStatusPill() {
  const isOnline = useOnlineStatus();
  const [lastSynced, setLastSynced] = useState(Date.now());
  const [pendingSyncs, setPendingSyncs] = useState(0);

  useEffect(() => {
    if (isOnline) {
      setLastSynced(Date.now());
      setPendingSyncs(0); // Simulate sync
    } else {
      setPendingSyncs(3); // Simulate pending
    }
  }, [isOnline]);

  const getSyncedText = () => {
    const diff = Date.now() - lastSynced;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  return (
    <Link to="/sync-patterns" className="fixed top-4 right-4 z-50 inline-block">
      <AnimatePresence mode="wait">
        {isOnline ? (
          <motion.div
            key="online"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-4 py-2 text-xs flex items-center gap-1"
          >
            <span>🟢</span>
            <span>Online — Synced {getSyncedText()}</span>
          </motion.div>
        ) : (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-4 py-2 text-xs flex items-center gap-2 relative"
          >
            <VitaAvatar state="offline" size={16} />
            <span>🔴 Offline — Last synced {getSyncedText()}</span>
            {pendingSyncs > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full px-1 animate-pulse">
                {pendingSyncs}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}
