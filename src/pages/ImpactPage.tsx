import { useState, useEffect } from "react";
import { getImpactStats } from "../services/aiSearch";
import { motion, AnimatePresence } from "framer-motion";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const TESTIMONIALS = [
  "After 3 days of searching, VitaChain found a pediatric surgeon for my son in Enugu. — Amina",
  "When the network went down during the storm, this app still helped us find emergency care. — Chinedu",
  "I registered a need for malaria medicine and got an alert within hours. It truly watches over us. — Fatima"
];

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return <>{count.toLocaleString()}</>;
}

export default function ImpactPage() {
  const [stats, setStats] = useState({ 
    watching: 0, 
    connections: 0, 
    facilities: 0,
    contradictionsFlagged: 0,
    medicalDesertsIdentified: 0
  });
  const [loading, setLoading] = useState(true);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const data = await getImpactStats();
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const tInterval = setInterval(() => {
      setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(tInterval);
  }, []);

  useEffect(() => {
    const sInterval = setInterval(() => {
      setSecondsAgo(prev => prev + 1);
    }, 1000);
    return () => clearInterval(sInterval);
  }, []);

  return (
    <div className="flex flex-col gap-6 relative overflow-hidden min-h-[75vh]">
      {/* Drifting blur orb */}
      <motion.div 
        animate={{ x: [0, 20, -10, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-10 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none z-0" 
      />

      <header className="pt-4 relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-slate-100 mb-2 leading-tight"
        >
          Our Collective Impact
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 mb-2 text-sm">
          VitaChain grows stronger with every community member.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-xs font-medium tabular-nums flex items-center gap-1.5 text-teal-400/80 bg-teal-500/10 w-fit px-2 py-1 rounded-full border border-teal-500/20">
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-teal-400 animate-pulse' : 'bg-amber-400'}`} />
          {isOnline ? `Live — updated ${secondsAgo}s ago` : 'Last synced: 2 hours ago'}
        </motion.div>
      </header>

      <section className="relative z-10 flex-1 flex flex-col justify-between gap-8 pb-8">
        {loading ? (
          <div className="text-center py-10 text-slate-500 text-sm">Loading impact stats...</div>
        ) : (
          <motion.div 
            initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card p-6 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-4xl font-bold text-primary tracking-tight tabular-nums">
                <AnimatedCounter value={stats.watching} />
              </span>
              <span className="text-slate-400 text-sm font-medium">Families Watching</span>
            </motion.div>
            
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card p-6 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
              <span className="text-4xl font-bold text-primary tracking-tight tabular-nums">
                <AnimatedCounter value={stats.connections} />
              </span>
              <span className="text-slate-400 text-sm font-medium">Connections Made</span>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card p-6 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-4xl font-bold text-primary tracking-tight tabular-nums">
                <AnimatedCounter value={stats.facilities} />
              </span>
              <span className="text-slate-400 text-sm font-medium">Facilities Monitored</span>
            </motion.div>
          </motion.div>
        )}

        {/* Additional Impact Stats Row */}
        {!loading && (
          <motion.div 
            initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card p-6 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-4xl font-bold text-primary tracking-tight tabular-nums">
                <AnimatedCounter value={stats.contradictionsFlagged} />
              </span>
              <span className="text-slate-400 text-sm font-medium">Contradictions Flagged</span>
            </motion.div>
            
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card p-6 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-4xl font-bold text-primary tracking-tight tabular-nums">
                <AnimatedCounter value={stats.medicalDesertsIdentified} />
              </span>
              <span className="text-slate-400 text-sm font-medium">Medical Deserts Identified</span>
            </motion.div>
          </motion.div>
        )}

        {/* Abstract Map */}
        <div className="relative h-32 w-full flex items-center justify-center opacity-40">
          <svg viewBox="0 0 100 100" className="w-full h-full text-slate-600 stroke-current stroke-[0.5] fill-transparent">
            {/* Very abstract rough outline resembling Nigeria */}
            <path d="M 20 50 Q 30 20 60 20 T 90 40 Q 85 70 70 80 T 40 90 Q 20 85 15 60 Z" />
          </svg>
          {/* Pulsing dots */}
          {[
            { top: '30%', left: '40%' },
            { top: '60%', left: '30%' },
            { top: '70%', left: '60%' },
            { top: '40%', left: '70%' },
            { top: '50%', left: '50%' },
          ].map((pos, i) => (
            <motion.div 
              key={i}
              className="absolute w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(20,184,166,0.8)]"
              style={pos}
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-24 h-24 rounded-full overflow-hidden border-2 border-teal-500/30 shadow-glow"
          >
            <img src="/assets/nana.jpg" alt="Nana" className="w-full h-full object-cover" />
          </motion.div>
          <div className="text-center md:text-left h-20 flex items-center justify-center flex-1">
            <AnimatePresence mode="wait">
              <motion.p 
                key={testimonialIdx}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="italic text-slate-400 text-sm px-4 leading-relaxed"
              >
                "{TESTIMONIALS[testimonialIdx]}"
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}