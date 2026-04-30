import { useAuth } from "@clerk/clerk-react";
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) loadLogs();
  }, [user]);

  const loadLogs = async () => {
    if (!user) return;
    const data = await getCycleLogs(user.id, 365);
    setLogs(data);
  };

  const saveLog = async () => {
    if (!user) return;
    setLoading(true);
    const dateStr = selectedDate.toISOString().split("T")[0];
    const existingIdx = logs.findIndex(l => l.date === dateStr && l.userId === user.id);
    const log = {
      userId: user.id,
      date: dateStr,
      periodStart: flow !== "none" && (logs.length === 0 || !logs.some(l => l.date < dateStr && l.flow !== "none")), // simple heuristics
      periodEnd: flow === "none" && logs.some(l => l.date < dateStr && l.flow !== "none"),
      flow,
      pain,
      mood,
      notes: notes || undefined,
      timestamp: Date.now(),
    };
    // Note: addCycleLog will create new; for updates we'd need update function. We'll just add new for simplicity.
    await addCycleLog(log as any);
    await loadLogs();
    setLoading(false);
  };

  // Stats
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

  // Calendar helpers
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    return d.getDay() === 0 ? 6 : d.getDay() - 1; // Monday = 0
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="text-rose-400" />
            Cycle Tracker
          </h1>
          <p className="text-slate-400 text-sm">Track your menstrual cycle</p>
        </div>
        {user?.unsafeMetadata?.gender === "male" && (
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">For female users</span>
        )}
      </div>

      {/* Stats */}
      {cycleStats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 text-center">
            <div className="text-xl font-bold text-white">{cycleStats.averageCycle}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Avg Cycle (d)</div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 text-center">
            <div className="text-xl font-bold text-white">{cycleStats.periodLogs}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Periods Logged</div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 text-center">
            <div className="text-xl font-bold text-rose-400 truncate">
              {cycleStats.predictedNext ? new Date(cycleStats.predictedNext).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Next Period</div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
        <div className="flex items-center justify-between mb-4">
          <button onClick={goToPrevMonth} className="p-1 hover:bg-slate-700/50 rounded-lg text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </h2>
          <button onClick={goToNextMonth} className="p-1 hover:bg-slate-700/50 rounded-lg text-slate-400">
            <ChevronRight size={20} />
          </button>
        </div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["M", "T", "W", "T", "F", "S", "S"].map(d => (
            <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
          ))}
        </div>
        {/* Days */}
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
              <button
                key={day}
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm relative ${
                  isSelected ? "bg-teal-500 text-white font-bold" : "text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                {day}
                {hasLog && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${flowColor || "bg-teal-400"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Log */}
      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar size={16} />
          Log for {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </h3>

        {/* Flow */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-2 block">Flow</label>
          <div className="flex gap-2">
            {FLOW_LEVELS.map(level => (
              <button
                key={level.value}
                onClick={() => setFlow(level.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1.5 ${
                  flow === level.value
                    ? `${level.color} text-white ring-2 ring-white/20`
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                }`}
              >
                {level.icon}
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pain */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-2 block">Pain Level (0-10)</label>
          <div className="flex items-center gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
              <button
                key={p}
                onClick={() => setPain(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                  pain === p ? "bg-rose-500 text-white" : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-2 block">Mood</label>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map(m => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`text-2xl p-2 rounded-lg transition-all ${
                  mood === m ? "bg-teal-500/20 ring-2 ring-teal-500" : "bg-slate-700/50 hover:bg-slate-600/50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-2 block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Any symptoms, cravings, or observations..."
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200 resize-none"
          />
        </div>

        <button
          onClick={saveLog}
          disabled={loading}
          className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <Flame size={18} />
          {loading ? "Saving..." : "Save Entry"}
        </button>
      </div>

      {/* Insights */}
      {logs.length > 0 && (
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
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
