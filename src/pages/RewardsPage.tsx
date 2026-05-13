import { motion } from "framer-motion";
import { Award, Sparkles, Target, Flame, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getTotalPoints, getBadges, getStreak, awardPoints, getLeaderboard } from "../services/rewardsEngine";
import { getItem, setItem } from "../lib/idb";
import LoadingSpinner from "../components/LoadingSpinner";

export default function RewardsPage() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<Array<{ id: string; name: string; icon: string; earnedAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<Array<{ userId: string; points: number; rank: number }>>([]);

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

      // Try loading from IDB
      const [pointsVal, badgesList, streakData, leaderboardData] = await Promise.all([
        getTotalPoints(userId),
        getBadges(userId),
        getStreak(userId, "login"),
        getLeaderboard(10),
      ]);

      setPoints(pointsVal);
      setBadges(badgesList);
      setStreak(streakData.current || 0);
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error("Failed to load rewards:", err);
      // Try localStorage fallback
      const saved = localStorage.getItem("rewards_fallback");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPoints(parsed.points || 0);
          setStreak(parsed.streak || 0);
          setBadges(parsed.badges || []);
        } catch { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={48} />
          <p className="text-slate-400 text-sm">Loading rewards...</p>
        </div>
      </div>
    );
  }

  const completedQuests = 6; // Placeholder; would be computed from quest progress
  const totalQuests = 9;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Rewards</h1>
        <p className="text-slate-400">Earn points for healthy habits</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-teal-400">{points.toLocaleString()}</p>
          <p className="text-slate-400 text-xs mt-1">Total Points</p>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400 text-2xl mb-1">
            <Flame size={24} />
            <span className="font-bold">{streak}</span>
          </div>
          <p className="text-slate-400 text-xs">Day Streak</p>
        </div>
      </div>

      {/* Next reward */}
      <div className="glass-card p-6 text-center">
        <Award className="text-amber-400 mx-auto mb-3" size={40} />
        <h2 className="text-lg font-semibold text-white mb-2">Next Reward</h2>
        <p className="text-slate-400 text-sm mb-4">
          Complete {totalQuests - completedQuests} more quests to unlock the "Health Champion" badge.
        </p>
        <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedQuests / totalQuests) * 100}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">{completedQuests}/{totalQuests} quests completed</p>
      </div>

      {/* Badges */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Your Badges</h2>
        {badges.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Complete actions to earn badges!</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((badge) => {
              // Find icon from rewardsEngine BADGES
              const allBadges = [
                { id: "first_steps", icon: "👶", name: "First Steps" },
                { id: "health_scribe", icon: "📝", name: "Health Scribe" },
                { id: "medication_master", icon: "💊", name: "Medication Master" },
                { id: "passport_pro", icon: "📤", name: "Passport Pro" },
                { id: "workout_warrior", icon: "💪", name: "Workout Warrior" },
                { id: "mindful_soul", icon: "🧠", name: "Mindful Soul" },
                { id: "streak_champion", icon: "🔥", name: "Streak Champion" },
                { id: "community_guardian", icon: "🛡️", name: "Community Guardian" },
                { id: "care_connector", icon: "🤝", name: "Care Connector" },
                { id: "nutrition_navigator", icon: "🥗", name: "Nutrition Navigator" },
                { id: "hydration_hero", icon: "💧", name: "Hydration Hero" },
                { id: "sleep_steward", icon: "😴", name: "Sleep Steward" },
                { id: "cycle_sage", icon: "📅", name: "Cycle Sage" },
                { id: "first_responder", icon: "🚑", name: "First Responder" },
                { id: "vitachain_advocate", icon: "📢", name: "VitaChain Advocate" },
              ];
              const badgeDef = allBadges.find((b) => b.id === badge.id);
              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl border text-center bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/20"
                >
                  <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 bg-amber-500/20 text-amber-400">
                    {badgeDef?.icon || "🏆"}
                  </div>
                  <p className="font-medium text-sm text-white">{badge.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Earned {new Date(badge.earnedAt).toLocaleDateString()}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <div key={entry.userId} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-amber-400">#{idx + 1}</span>
                  <span className="text-sm text-slate-200">User {entry.userId.slice(0, 8)}</span>
                </div>
                <span className="text-sm font-semibold text-teal-400">{entry.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
