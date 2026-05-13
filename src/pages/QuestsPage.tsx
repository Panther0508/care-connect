import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Sparkles, Target, Award, Star, Medal, Crown, Flame, Zap, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getActiveQuests, getAvailableQuests, joinQuest, updateQuestProgress, getQuestHistory } from "../services/questEngine";
import { useStatus } from "../hooks/useStatus";
import LoadingSpinner from "../components/LoadingSpinner";

interface Quest {
  id: string;
  title: string;
  description: string;
  duration: number;
  requirements: Array<{ type: string; count: number; per?: string }>;
  rewardPoints: number;
  badgeUnlock?: string;
  difficulty: "easy" | "medium" | "hard";
  progress?: number;
  daysRemaining?: number;
  joinedAt?: string;
}

export default function QuestsPage() {
  const { user } = useAuth();
  const { showStatus } = useStatus();
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
  const [completedQuestHistory, setCompletedQuestHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const userId = user?.id || "default";

      const [active, available, history] = await Promise.all([
        getActiveQuests(userId),
        getAvailableQuests(userId),
        getQuestHistory(userId),
      ]);

      setActiveQuests(active as Quest[]);
      setAvailableQuests(available as Quest[]);
      setCompletedQuestHistory(history);
    } catch (err) {
      console.error("Failed to load quests:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(questId: string) {
    if (!user) return;
    try {
      setJoining(questId);
      const result = await joinQuest(user.id, questId);
      if (result.success) {
        showStatus("success", "Quest Joined!", "Complete tasks to earn rewards.");
        await loadData();
      } else {
        showStatus("warning", "Already Joined", "This quest is already in progress.");
      }
    } catch (err: any) {
      console.error("Failed to join quest:", err);
      showStatus("error", "Error", err?.message || "Could not join quest.");
    } finally {
      setJoining(null);
    }
  }

  const completedCount = activeQuests.filter((q) => (q as any).completed).length;
  const totalRewards = activeQuests.reduce((sum, q) => sum + (q.progress || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={48} />
          <p className="text-slate-400 text-sm">Loading quests...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Quests</h1>
        <p className="text-slate-400">Complete challenges, earn rewards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold text-teal-400">{activeQuests.length}</p>
          <p className="text-slate-400 text-xs mt-1">Active Quests</p>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400 text-2xl mb-1">
            <Flame size={24} />
            <span className="font-bold">{completedQuestHistory.length}</span>
          </div>
          <p className="text-slate-400 text-xs">Completed</p>
        </div>
      </div>

      {/* Active quests */}
      {activeQuests.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Active Quests</h2>
            <span className="text-xs text-slate-400">{completedCount}/{activeQuests.length} completed</span>
          </div>
          <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / activeQuests.length) * 100}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
            />
          </div>

          <div className="space-y-2.5">
            {activeQuests.map((quest) => (
              <div
                key={quest.id}
                className={`p-3 rounded-xl border transition-all ${
                  (quest as any).completed
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-slate-800/30 border-slate-700/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      (quest as any).completed ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700/50 text-slate-400"
                    }`}
                  >
                    {(quest as any).completed ? <Check size={16} /> : <Target size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${(quest as any).completed ? "text-emerald-300" : "text-white"}`}>
                      {quest.title}
                    </p>
                    <p className="text-xs text-slate-400">{quest.rewardPoints} pts • {quest.duration} days</p>
                  </div>
                  {(quest as any).completed && <Sparkles size={16} className="text-amber-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available quests */}
      {availableQuests.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Available Quests</h2>
          <div className="space-y-3">
            {availableQuests.map((quest) => (
              <div key={quest.id} className="p-4 rounded-xl border bg-slate-800/30 border-slate-700/30">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{quest.title}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      quest.difficulty === "easy"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : quest.difficulty === "medium"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {quest.difficulty}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-3">{quest.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Reward: {quest.rewardPoints} pts</span>
                  <button
                    onClick={() => handleJoin(quest.id)}
                    disabled={joining === quest.id}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    {joining === quest.id ? <Loader2 size={14} className="animate-spin" /> : "Join"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {completedQuestHistory.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Completed Quests</h2>
          <div className="space-y-2">
            {completedQuestHistory.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <Check className="text-emerald-400" size={16} />
                  <span className="text-sm text-slate-200">{entry.title || "Quest"}</span>
                </div>
                <span className="text-sm text-teal-400">+{entry.rewardPoints} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
