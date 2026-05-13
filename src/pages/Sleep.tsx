import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
  Moon,
  Clock,
  Star,
  Save,
  BarChart3,
  Bed,
  Coffee,
  TrendingUp
} from "lucide-react";
import { addSleepLog, getSleepLogs, type SleepLog } from "../lib/idb";
import LoadingSpinner from "../components/LoadingSpinner";

const QUALITY_LABELS = ["Very Poor", "Poor", "Fair", "Good", "Excellent"];

export default function SleepPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("22:00");
  const [endTime, setEndTime] = useState("06:00");
  const [quality, setQuality] = useState<3>(3);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
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
      const data = await getSleepLogs(user.id, 30);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load sleep logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start: string, end: string): number => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let startMs = sh * 60 + sm;
    let endMs = eh * 60 + em;
    if (endMs < startMs) endMs += 24 * 60; // overnight
    return Math.round((endMs - startMs) / 60);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const duration = calculateDuration(startTime, endTime);
    const log = {
      userId: user.id,
      date,
      startTime,
      endTime,
      durationMinutes: duration,
      quality: quality as 1 | 2 | 3 | 4 | 5,
      notes: notes || undefined,
      timestamp: Date.now(),
    };
    await addSleepLog(log);
    await loadLogs();
    setSaving(false);
  };

  const avgDuration = logs.length ? Math.round(logs.reduce((sum, l) => sum + l.durationMinutes, 0) / logs.length) : 0;
  const avgQuality = logs.length ? (logs.reduce((sum, l) => sum + l.quality, 0) / logs.length).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={48} />
          <p className="text-slate-400 text-sm">Loading sleep data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Moon className="text-indigo-400" />
          Sleep
        </h1>
        <p className="text-slate-400 text-sm">Track your rest patterns</p>
      </div>

      {/* Stats */}
      {logs.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Clock size={14} />
              <span className="text-xs">Avg Duration</span>
            </div>
            <div className="text-xl font-bold text-white">
              {Math.floor(avgDuration / 60)}h {avgDuration % 60}m
            </div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Star size={14} />
              <span className="text-xs">Avg Quality</span>
            </div>
            <div className="text-xl font-bold text-white">{avgQuality}/5.0</div>
          </div>
        </div>
      )}

      {/* Entry Form */}
      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Bed size={16} />
          Log Sleep
        </h3>

        {/* Date */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-2 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200"
          />
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-2 block flex items-center gap-2">
              <Clock size={12} />
              Bedtime
            </label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block flex items-center gap-2">
              <Coffee size={12} />
              Wake-up
            </label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200"
            />
          </div>
        </div>

        {/* Duration preview */}
        <div className="mb-4 p-3 bg-slate-900/30 rounded-lg border border-slate-700/20">
          <div className="text-sm text-slate-300">
            Estimated duration: <span className="font-bold text-white">{calculateDuration(startTime, endTime)} minutes</span>
            <span className="text-slate-400 ml-1">
              ({Math.floor(calculateDuration(startTime, endTime) / 60)}h {calculateDuration(startTime, endTime) % 60}m)
            </span>
          </div>
        </div>

        {/* Quality */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-2 block flex items-center gap-2">
            <Star size={12} />
            Sleep Quality
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(q => (
              <button
                key={q}
                onClick={() => setQuality(q as 1 | 2 | 3 | 4 | 5)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  quality === q
                    ? "bg-indigo-500/20 border-2 border-indigo-500 text-indigo-300"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
            <span>{QUALITY_LABELS[0]}</span>
            <span>{QUALITY_LABELS[4]}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-2 block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="How did you sleep? Dreams, interruptions, etc."
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Sleep Log"}
        </button>
      </div>

      {/* Recent Logs */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Recent Sleep</h3>
          {logs.slice(0, 7).map(log => (
            <div key={log.id} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-200">{new Date(log.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
                <div className="text-xs text-slate-400">
                  {log.startTime} - {log.endTime} ({Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m)
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < log.quality ? "text-amber-400 fill-amber-400" : "text-slate-600"}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
