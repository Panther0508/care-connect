import { useState, useEffect } from "react";
import { useSavedNeeds } from "../hooks/useSavedNeeds";
import { motion, AnimatePresence } from "framer-motion";

function RelativeTime({ timestamp }: { timestamp: number }) {
  const [timeText, setTimeText] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const ms = Date.now() - timestamp;
      const mins = Math.floor(ms / 60000);
      if (mins < 1) setTimeText("Just now");
      else if (mins < 60) setTimeText(`${mins} min ago`);
      else if (mins < 1440) setTimeText(`${Math.floor(mins/60)} hours ago`);
      else setTimeText(`${Math.floor(mins/1440)} days ago`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return <span>Watching since {timeText}</span>;
}

export default function RegisterNeedPage() {
  const [needText, setNeedText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { needs, loading, addNeed, removeNeed } = useSavedNeeds();

  const handleSave = async () => {
    if (!needText.trim()) return;
    await addNeed(needText);
    setNeedText("");
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <header className="pt-4">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-slate-100 mb-2 leading-tight"
        >
          We'll watch for the care your family needs
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-slate-400 mb-6 text-sm"
        >
          Describe the service, urgency, and distance.
        </motion.p>

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
          className={`glass-card flex flex-col gap-3 p-4 transition-all duration-300 ${isFocused ? 'ring-2 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'shadow-glow'}`}
        >
          <textarea
            className="bg-transparent text-slate-100 outline-none resize-none placeholder:text-slate-500 w-full"
            rows={4}
            placeholder="e.g., Pediatric physiotherapy for my son, within 20 km"
            value={needText}
            onChange={(e) => setNeedText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          
          <AnimatePresence>
            {needText.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex justify-between items-center text-xs"
              >
                <span className="text-emerald-400 italic">Describing clearly helps us match faster.</span>
                <span className="text-slate-500 tabular-nums">{needText.length} chars</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="btn-primary w-full mt-1"
            disabled={!needText.trim()}
          >
            Watch This Need
          </motion.button>
        </motion.div>
      </header>

      <section className="mt-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-slate-300 font-semibold">Watching Now</h2>
          {needs.length > 0 && (
            <div className="relative w-8 h-8 flex items-center justify-center">
              {/* Radar visualization */}
              <div className="absolute inset-0 border border-teal-500/30 rounded-full" />
              <div className="absolute inset-2 border border-teal-500/20 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-t-2 border-teal-400"
              />
              <div className="w-1 h-1 bg-teal-400 rounded-full" />
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-10 text-slate-500 text-sm">Loading...</div>
        ) : needs.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 text-slate-500 text-sm glass-card border-dashed">
            No needs registered yet. We're here when you need us.
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {needs.map((need, index) => (
                <motion.div 
                  key={need.date} 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card p-4 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] flex-shrink-0 animate-pulse" />
                    <div>
                      <p className="text-slate-200 text-sm leading-relaxed">{need.text}</p>
                      <p className="text-slate-500 text-xs mt-1 tabular-nums">
                        <RelativeTime date={need.date} />
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeNeed(index)}
                    className="btn-secondary text-xs py-1 px-3 flex-shrink-0"
                  >
                    Remove
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
