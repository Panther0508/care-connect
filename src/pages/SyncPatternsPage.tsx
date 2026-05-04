import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wifi, WifiOff, Clock } from "lucide-react";

export default function SyncPatternsPage() {
  const navigate = useNavigate();

  // Mock data for the day's online/offline pattern
  const mockPatterns = [
    { time: "00:00", status: "offline" },
    { time: "06:00", status: "offline" },
    { time: "07:00", status: "online" },
    { time: "12:00", status: "online" },
    { time: "13:00", status: "offline" },
    { time: "17:00", status: "online" },
    { time: "20:00", status: "offline" },
    { time: "23:59", status: "offline" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-slate-300 hover:text-slate-100">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Sync Patterns</h1>
          <p className="text-slate-400 text-sm">Your online and offline activity for today</p>
        </div>
      </header>

      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-teal-400" />
          Daily Connectivity Overview
        </h2>
        <div className="space-y-3">
          {mockPatterns.map((slot, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30"
            >
              <span className="text-slate-300 text-sm">{slot.time}</span>
              <div className="flex items-center gap-2">
                {slot.status === 'online' ? (
                  <>
                    <Wifi size={16} className="text-emerald-400" />
                    <span className="text-emerald-400 text-sm">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={16} className="text-red-400" />
                    <span className="text-red-400 text-sm">Offline</span>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 text-sm text-slate-400">
        <p>
          VitaChain syncs your health data whenever you come online. Offline periods are normal; your data remains secure on-device until connection resumes.
        </p>
      </div>
    </div>
  );
}
