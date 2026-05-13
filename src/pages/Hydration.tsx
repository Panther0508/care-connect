import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
  Droplets,
  Plus,
  Minus,
  Trophy,
  Target,
  GlassWater,
  Clock
} from "lucide-react";
import { getHydration, setHydration, type HydrationLog } from "../lib/idb";
import LoadingSpinner from "../components/LoadingSpinner";

const GLASS_SIZE_ML = 250;
const DEFAULT_GOAL = 8; // glasses

export default function HydrationPage() {
  const { user } = useAuth();
  const [today, setToday] = useState("");
  const [glasses, setGlasses] = useState(0);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [loading, setLoading] = useState(true);
  const [weekGlasses, setWeekGlasses] = useState<number[]>(new Array(7).fill(0));

  useEffect(() => {
    const dateStr = new Date().toISOString().split("T")[0];
    setToday(dateStr);
    if (user) {
      loadHydration(dateStr);
      loadWeekHydration(user.id, dateStr);
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadWeekHydration = async (userId: string, todayDate: string) => {
    if (!userId) return;
    try {
      const weekData: number[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        const log = await getHydration(userId, dateStr);
        weekData.push(log ? log.glasses : 0);
      }
      setWeekGlasses(weekData);
    } finally {
      setLoading(false);
    }
  };

  const loadHydration = async (date: string) => {
    if (!user) return;
    try {
      const log = await getHydration(user.id, date);
      if (log) {
        setGlasses(log.glasses);
        setGoal(Math.max(1, Math.round(log.totalMl / GLASS_SIZE_ML)));
      } else {
        setGlasses(0);
        setGoal(DEFAULT_GOAL);
      }
    } finally {
      // Note: loadWeekHydration also sets loading false, so we don't set it here
      // to avoid race conditions
    }
  };

  const updateHydration = useCallback(async (delta: number) => {
    if (!user || !today) return;
    setLoading(true);
    const newGlasses = Math.max(0, glasses + delta);
    setGlasses(newGlasses);
    const log: HydrationLog = {
      date: today,
      userId: user.id,
      glasses: newGlasses,
      totalMl: newGlasses * GLASS_SIZE_ML,
      lastUpdated: Date.now(),
    };
    await setHydration(log);
    setLoading(false);
  }, [user, today, glasses]);

  const percentage = Math.min((glasses / goal) * 100, 100);
  const completed = glasses >= goal;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={48} />
          <p className="text-slate-400 text-sm">Loading hydration data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Droplets className="text-blue-400" />
          Hydration
        </h1>
        <p className="text-slate-400 text-sm">Stay hydrated, stay healthy</p>
      </div>

      {/* Progress Circle */}
      <div className="relative flex items-center justify-center py-6">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-40 h-40" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={completed ? "rgb(20, 184, 166)" : "rgb(59, 130, 246)"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 2.51} 251`}
              transform="rotate(-90 50 50)"
            />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="text-5xl font-bold text-white mb-1">{glasses}</div>
          <div className="text-slate-400 text-sm">of {goal} glasses</div>
          <div className="text-blue-400 text-xs mt-2">{Math.round(percentage)}% of daily goal</div>
        </div>
        {completed && (
          <div className="absolute top-4 right-4 bg-teal-500/20 p-2 rounded-full">
            <Trophy size={20} className="text-teal-400" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => updateHydration(-1)}
          disabled={glasses <= 0 || loading}
          className="p-4 glass-card border border-slate-700/50 hover:border-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center gap-2"
        >
          <Minus size={24} className="text-slate-400" />
          <span className="text-slate-300 text-sm">Remove</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => updateHydration(1)}
          disabled={loading}
          className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30 hover:border-blue-400/50 transition-all flex flex-col items-center gap-2"
        >
          <Plus size={24} className="text-blue-400" />
          <span className="text-blue-300 text-sm">Add Glass</span>
        </motion.button>
      </div>

      {/* Goal adjustment */}
      <div className="glass-card p-4 border-0">
        <label className="text-xs text-slate-400 mb-2 block flex items-center gap-2">
          <Target size={12} />
          Daily Goal (glasses)
        </label>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => setGoal(g => Math.max(1, g - 1))}
            className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded text-slate-300"
          >
            -
          </motion.button>
          <div className="flex-1 text-center">
            <span className="text-2xl font-bold text-white">{goal}</span>
            <span className="text-slate-400 ml-1">({goal * GLASS_SIZE_ML} mL)</span>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => setGoal(g => g + 1)}
            className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded text-slate-300"
          >
            +
          </motion.button>
        </div>
      </div>

      {/* Tips */}
      <div className="glass-card p-4 border-0">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <GlassWater size={16} />
          Hydration Tips
        </h3>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>Drink a glass of water when you wake up</li>
          <li>Keep a water bottle nearby throughout the day</li>
          <li>Drink before, during, and after exercise</li>
          <li>Eat water-rich foods like fruits and vegetables</li>
        </ul>
      </div>

      {/* Weekly Summary */}
      <div className="glass-card p-4 border-0">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Clock size={16} />
          This Week
        </h3>
        <div className="flex justify-between items-end h-24 gap-1">
          {[...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split("T")[0];
            const isToday = dateStr === today;
            // Height as percentage of daily goal (max 100%)
            const dayGlasses = weekGlasses[i] || 0;
            const barHeight = Math.min((dayGlasses / Math.max(goal, 1)) * 100, 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t transition-all ${
                    isToday ? "bg-blue-500 shadow-glow-primary" : "bg-blue-500/50"
                  }`}
                  style={{ height: `${Math.max(barHeight, 2)}%` }}
                />
                <span className="text-xs text-slate-500">
                  {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
