import { useState, useEffect } from "react";
import { FacilityCard } from "../components/FacilityCard";
import type { Facility } from "../services/aiSearch";
import { checkForAlerts } from "../services/needWatcher";
import { useSavedNeeds } from "../hooks/useSavedNeeds";
import { motion, AnimatePresence } from "framer-motion";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const { needs } = useSavedNeeds();

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      const data = await checkForAlerts();
      setAlerts(data);
      setLoading(false);
    };
    fetchAlerts();
  }, []); // We'll add needs as a dependency later if needed

  return (
    <div className="flex flex-col gap-6 relative min-h-[70vh]">
      {alerts.length > 0 && (
        <div className="absolute -top-20 inset-x-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none -z-10 animate-pulse" />
      )}
      
      <header className="pt-4 z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-slate-100 mb-2 leading-tight"
        >
          Your Care Alerts
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-slate-400 mb-6 text-sm"
        >
          Matches found while you were away.
        </motion.p>
      </header>

      <section className="flex-1 flex flex-col z-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10 text-slate-500 text-sm">Loading...</motion.div>
          ) : alerts.length === 0 ? (
            <motion.div 
              key="empty" 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="relative overflow-hidden flex-1 rounded-2xl flex flex-col items-center justify-center p-8 border border-slate-800/50 min-h-[300px]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-900" />
              {/* Twinkling stars */}
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.1, 1, 0.1] }}
                  transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 5 }}
                  className="absolute w-0.5 h-0.5 bg-white rounded-full"
                  style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
                />
              ))}
              
              <div className="relative z-10 text-center flex flex-col items-center gap-4">
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500/50">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </motion.div>
                <p className="text-slate-300 text-lg font-medium tracking-wide">The night is quiet.</p>
                <p className="text-slate-500 text-sm">
                  {needs.length > 0 
                    ? "But we're still watching over your family. Your needs are securely registered." 
                    : "Register a need so we can watch 24/7."}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="alerts" 
              initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              className="flex flex-col gap-4"
            >
              {alerts.map((facility, index) => (
                <FacilityCard key={facility.id} facility={{...facility, isNewMatch: true}} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
