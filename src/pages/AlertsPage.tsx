import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VitaAvatar from "../components/VitaAvatar";
import { checkForAlerts } from "../services/needWatcher";
import { useSavedNeeds } from "../hooks/useSavedNeeds";
import { getOutbreakAlerts } from "../services/meshOutbreakDetector";
import { AlertTriangle, Building2 } from "lucide-react";

export default function AlertsPage() {
  const [facilityAlerts, setFacilityAlerts] = useState<any[]>([]);
  const [outbreakAlerts, setOutbreakAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { needs } = useSavedNeeds();

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      const [facilityData, outbreakData] = await Promise.all([checkForAlerts(), getOutbreakAlerts()]);
      setFacilityAlerts(facilityData);
      setOutbreakAlerts(outbreakData);
      setLoading(false);
    };
    fetchAlerts();
  }, []);

  const totalAlerts = facilityAlerts.length + outbreakAlerts.length;

  return (
    <div className="flex flex-col gap-6 relative min-h-[70vh]">
      {totalAlerts > 0 && (
        <div className="absolute -top-20 inset-x-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none -z-10 animate-pulse" />
      )}

      <header className="pt-4 z-10 relative">
        {totalAlerts > 0 && (
          <div className="absolute -top-20 right-0">
            <VitaAvatar state="alert" size={60} />
          </div>
        )}
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-slate-100 mb-2 leading-tight">
          Your Care Alerts
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 mb-6 text-sm">
          {totalAlerts > 0 ? `${totalAlerts} new updates!` : "You're all caught up."}
        </motion.p>
      </header>

      <section className="flex-1 flex flex-col z-10 space-y-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10 text-slate-500 text-sm">
              Loading...
            </motion.div>
          ) : totalAlerts === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative overflow-hidden flex-1 rounded-2xl flex flex-col items-center justify-center p-8 border border-slate-800/50 min-h-[300px]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-900" />
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
                <VitaAvatar state="empty" size={80} />
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-slate-300 text-lg font-medium tracking-wide">
                  {needs.length > 0 ? "We're watching over your family. Alerts will appear here." : "Register a need so we can watch 24/7."}
                </motion.p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="alerts" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="flex flex-col gap-4">
               {/* Outbreak alerts section */}
               {outbreakAlerts.length > 0 && (
                 <div className="space-y-3">
                   <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                     <AlertTriangle className="text-rose-500" size={20} />
                     Community Health Alerts
                   </h2>
                   {outbreakAlerts.map((alert) => (
                     <motion.div
                       key={alert.id}
                       whileHover={{ x: 2 }}
                       className="glass-card"
                     >
                       <div className="flex items-start gap-3">
                         <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                           <AlertTriangle size={20} />
                         </div>
                         <div className="flex-1">
                           <h3 className="font-semibold text-white capitalize">{alert.term}</h3>
                           <p className="text-sm text-slate-300 mt-1">
                             {alert.count} people in {alert.region} recently searched for this term.
                           </p>
                           <p className="text-xs text-slate-500 mt-1">
                             Detected {new Date(alert.firstDetectedAt).toLocaleDateString()}
                           </p>
                         </div>
                         <span className={`px-2 py-1 rounded text-xs ${alert.status === 'active' ? 'bg-rose-600/50 text-rose-100' : 'bg-slate-600/50 text-slate-300'}`}>
                           {alert.status}
                         </span>
                       </div>
                     </motion.div>
                   ))}
                 </div>
               )}

              {/* Facility match alerts */}
              {facilityAlerts.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Building2 className="text-emerald-500" size={20} />
                    Facility Matches
                  </h2>
                  {facilityAlerts.map((facility, index) => (
                    <motion.div
                      key={facility.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{facility.name}</h4>
                        {facility.isNewMatch && <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">New Match</span>}
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2">{facility.description}</p>
                      <a href={`/facility/${facility.id}`} className="inline-block mt-3 text-xs text-teal-400 hover:underline">
                        View details →
                      </a>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
