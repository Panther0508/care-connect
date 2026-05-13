import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  Droplets,
  Target,
  Heart,
  Smile,
  Frown,
  Meh,
  ChevronLeft,
  ChevronRight,
  Flame,
  Activity
} from "lucide-react";
import { addCycleLog, getCycleLogs, type CycleLog } from "../lib/idb";
import LoadingSpinner from "../components/LoadingSpinner";

const FLOW_LEVELS = [
  { value: "none" as const, label: "None", color: "bg-slate-600", icon: <Target size={12} /> },
  { value: "light" as const, label: "Light", color: "bg-teal-500/30", icon: <Droplets size={12} /> },
  { value: "medium" as const, label: "Medium", color: "bg-teal-500/60", icon: <Droplets size={12} /> },
  { value: "heavy" as const, label: "Heavy", color: "bg-rose-500", icon: <Droplets size={12} /> },
];

const MOODS = ["🙂", "😐", "😔", "😤", "😴", "💪", "😌"];

export default function CycleTrackerPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<CycleLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [flow, setFlow] = useState<"none" | "light" | "medium" | "heavy">("none");
  const [pain, setPain] = useState(0);
  const [mood, setMood] = useState(MOODS[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLogs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadLogs = async () => {
    if (!user) return;
    try {
      const data = await getCycleLogs(user.id, 365);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load cycle logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveLog = async () => {
    if (!user) return;
    setLoading(true);
    const dateStr = selectedDate.toISOString().split("T")[0];
    const existingIdx = logs.findIndex(l => l.date === dateStr && l.userId === user.id);
    const log = {
      userId: user.id,
      date: dateStr,
      periodStart: flow !== "none" && (logs.length === 0 || !logs.some(l => l.date < dateStr && l.flow !== "none")),
      periodEnd: flow === "none" && logs.some(l => l.date < dateStr && l.flow !== "none"),
      flow,
      pain,
      mood,
      notes: notes || undefined,
      timestamp: Date.now(),
    };
    await addCycleLog(log as any);
    await loadLogs();
    setLoading(false);
  };

  const cycleStats = useMemo(() => {
    const periodLogs = logs.filter(l => l.flow !== "none");
    if (periodLogs.length < 2) return null;
    const sorted = [...periodLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lengths: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].date);
      const curr = new Date(sorted[i].date);
      const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0 && diff < 60) lengths.push(diff);
    }
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length || 0;
    const lastPeriodStart = sorted[sorted.length - 1]?.date;
    const predictedNext = lastPeriodStart ? new Date(new Date(lastPeriodStart).getTime() + avg * 24 * 60 * 60 * 1000) : null;
    return { averageCycle: Math.round(avg), periodLogs: sorted.length, lastPeriodStart, predictedNext };
  }, [logs]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    return d.getDay() === 0 ? 6 : d.getDay() - 1;
  };

  const daysInMonth = getDaysInMonth(selectedDate);
  const startWeekday = firstDayOfMonth(selectedDate);

  const goToPrevMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  const goToNextMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));

  const isLogged = (day: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const log = logs.find(l => l.date === dateStr);
    return log?.flow !== "none" && log?.flow !== undefined;
  };

  const getFlowColor = (day: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const log = logs.find(l => l.date === dateStr);
    if (!log || log.flow === "none") return "";
    const level = FLOW_LEVELS.find(f => f.value === log.flow);
    return level?.color || "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={48} />
          <p className="text-slate-400 text-sm">Loading cycle data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="text-rose-400" />
            Cycle Tracker
          </h1>
           <p className="text-slate-300 text-sm">Track your menstrual cycle</p>
        </div>
        {user?.unsafeMetadata?.gender === "male" && (
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">For female users</span>
        )}
      </div>

      {cycleStats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center accent-border-l">
            <div className="text-xl font-bold text-white">{cycleStats.averageCycle}</div>
            <div className="text-base text-slate-300 uppercase tracking-wide">Avg Cycle (d)</div>
          </div>
          <div className="glass-card p-3 text-center accent-border-l">
            <div className="text-xl font-bold text-white">{cycleStats.periodLogs}</div>
            <div className="text-base text-slate-300 uppercase tracking-wide">Periods Logged</div>
          </div>
          <div className="glass-card p-3 text-center accent-border-l">
               <div className="text-xl font-bold text-rose-400 truncate">
                 {cycleStats.predictedNext ? new Date(cycleStats.predictedNext).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
               </div>
                <div className="text-base text-slate-300 uppercase tracking-wide">Next Period</div>
          </div>
        </div>
      )}

      <div className="glass-card p-4 border-0">
        <div className="flex items-center justify-between mb-4">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={goToPrevMonth} className="p-1 hover:bg-slate-700/50 rounded-lg text-slate-400">
            <ChevronLeft size={20} />
          </motion.button>
          <h2 className="text-lg font-semibold text-white">{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h2>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={goToNextMonth} className="p-1 hover:bg-slate-700/50 rounded-lg text-slate-400">
            <ChevronRight size={20} />
          </motion.button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["M", "T", "W", "T", "F", "S", "S"].map(d => (
            <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === new Date().getMonth();
            const hasLog = isLogged(day);
            const flowColor = getFlowColor(day);
            return (
              <motion.button key={day} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm relative ${
                  isSelected ? "bg-teal-500 text-white font-bold" : "text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                {day}
                {hasLog && <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${flowColor || "bg-teal-400"}`} />}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-5 border-0">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar size={16} />
          Log for {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </h3>

        <div className="mb-4">
          <label className="text-sm text-slate-300 mb-2 block font-medium">Flow</label>
          <div className="flex gap-2 flex-wrap">
            {FLOW_LEVELS.map(level => (
              <button key={level.value} onClick={() => setFlow(level.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  flow === level.value ? `${level.color} text-white ring-2 ring-white/20` : "glass-card text-slate-400 hover:border-teal-500/25 hover:text-slate-200"
                }`}>
                {level.icon} {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-slate-300 mb-2 block font-medium">Pain Level (0-10)</label>
          <div className="flex items-center gap-2 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
              <motion.button key={p} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={() => setPain(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  pain === p ? "bg-rose-500 text-white" : "glass-card text-slate-400 hover:border-teal-500/25"
                }`}>{p}</motion.button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-slate-300 mb-2 block font-medium">Mood</label>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map(m => (
              <motion.button key={m} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                onClick={() => setMood(m)}
                className={`text-xl p-2 rounded-xl transition-all ${
                  mood === m ? "bg-teal-500/20 ring-2 ring-teal-500" : "glass-card hover:border-teal-500/25"
                }`}>{m}</motion.button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-slate-300 mb-2 block font-medium">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Any symptoms, cravings, or observations..."
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-xl text-sm text-slate-200 resize-none glass-input" />
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={saveLog} disabled={loading}
          className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
          <Flame size={18} />
          {loading ? "Saving..." : "Save Entry"}
        </motion.button>
      </div>

      {logs.length > 0 && (
        <div className="glass-card p-4 border-0">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Activity size={16} />
            Insights
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex justify-between">
              <span>Average cycle length</span>
              <span className="font-mono text-white">{cycleStats?.averageCycle || "—"} days</span>
            </div>
            <div className="flex justify-between">
              <span>Total entries</span>
              <span className="font-mono text-white">{logs.length}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
