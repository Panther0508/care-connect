import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Dumbbell,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from "lucide-react";
import {
  getWorkoutLogs,
  type WorkoutLog
} from "../lib/idb";

export default function WorkoutHistoryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, -1 = last week, etc.

  useEffect(() => {
    if (user) loadLogs();
  }, [user]);

  const loadLogs = async () => {
    if (!user) return;
    const all = await getWorkoutLogs(user.id, 100);
    setLogs(all);
  };

  // Group logs by week
  const getWeekStats = (logs: WorkoutLog[]) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday
    weekStart.setHours(0, 0, 0, 0);

    const weekLogs = logs.filter(l => new Date(l.date) >= weekStart);
    const totalDuration = weekLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
    const totalSets = weekLogs.reduce((sum, l) => sum + l.exercises.reduce((s, ex) => s + ex.sets.length, 0), 0);
    const exerciseCount = weekLogs.reduce((sum, l) => sum + l.exercises.length, 0);

    return {
      workouts: weekLogs.length,
      duration: totalDuration,
      sets: totalSets,
      exercises: exerciseCount,
      logs: weekLogs
    };
  };

  const stats = getWeekStats(logs);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const totalVolume = logs.reduce((sum, l) => {
    return sum + l.exercises.reduce((exSum, ex) => {
      return exSum + ex.sets.reduce((setSum, s) => setSum + (s.weight * s.reps), 0);
    }, 0);
  }, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="text-teal-400" />
          Workout History
        </h1>
        <p className="text-slate-400 text-sm">Track your progress over time</p>
      </div>

      {/* Weekly Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Dumbbell size={16} />
            <span className="text-xs">Workouts</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.workouts}</div>
          <div className="text-xs text-slate-500">this week</div>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Clock size={16} />
            <span className="text-xs">Duration</span>
          </div>
          <div className="text-2xl font-bold text-white">{Math.floor(stats.duration / 60)}h {stats.duration % 60}m</div>
          <div className="text-xs text-slate-500">total time</div>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Award size={16} />
            <span className="text-xs">Sets</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.sets}</div>
          <div className="text-xs text-slate-500">total volume</div>
        </div>
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp size={16} />
            <span className="text-xs">Volume</span>
          </div>
          <div className="text-2xl font-bold text-white">{Math.floor(totalVolume).toLocaleString()}</div>
          <div className="text-xs text-slate-500">kg lifted</div>
        </div>
      </div>

      {/* Progress Chart (Simple Bar) */}
      {logs.length > 0 && (
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
          <h3 className="text-sm font-semibold text-white mb-3">Weekly Workouts</h3>
          <div className="flex items-end justify-between h-32 gap-2">
            {[...Array(7)].map((_, i) => {
              const day = new Date();
              day.setDate(day.getDate() - (6 - i));
              const dayStr = day.toISOString().split("T")[0];
              const dayLogs = logs.filter(l => l.date === dayStr);
              const height = Math.max(dayLogs.length * 20, 8);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-teal-500/70 rounded-t transition-all hover:bg-teal-400"
                    style={{ height: `${Math.min(height, 120)}px` }}
                  />
                  <span className="text-xs text-slate-500">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workout List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Recent Workouts</h3>
        {logs.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
            <Dumbbell size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No workouts yet</p>
            <p className="text-slate-500 text-sm">Complete your first workout to see history</p>
          </div>
        ) : (
          logs.slice(0, 20).map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-white">{log.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(log.date)}
                    </span>
                    {log.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {Math.floor(log.duration / 60)}h {log.duration % 60}m
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-teal-400">{log.exercises.length}</div>
                   <div className="text-xs text-slate-500">exercises</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {log.exercises.map((ex, i) => (
                  <span key={i} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded">
                    {ex.exerciseName} ({ex.sets.length} sets)
                  </span>
                ))}
              </div>
              {log.notes && (
                <p className="text-xs text-slate-500 mt-2 italic">"{log.notes}"</p>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
