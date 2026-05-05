import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Sparkles, Target, Award, Star, Medal, Crown, Flame, Zap } from "lucide-react";

export default function RewardsPage() {
  const [points, setPoints] = useState(2450);
  const [streak, setStreak] = useState(7);

  const quests = [
    { id: 1, title: "Log your vitals for 7 days", reward: 100, completed: true },
    { id: 2, title: "Complete 3 workouts", reward: 150, completed: false },
    { id: 3, title: "Ask AI 5 health questions", reward: 75, completed: false },
    { id: 4, title: "Medication adherence — 5 days", reward: 120, completed: true },
    { id: 5, title: "Read 2 health articles", reward: 50, completed: false },
  ];

  const badges = [
    { id: 1, name: "First Steps", icon: Star, earned: true, desc: "Complete your first health log" },
    { id: 2, name: "Week Warrior", icon: Flame, earned: true, desc: "7-day streak achieved" },
    { id: 3, name: "Medication Master", icon: Medal, earned: false, desc: "Perfect adherence for 30 days" },
    { id: 4, name: "Knowledge Seeker", icon: Zap, earned: false, desc: "Ask 50 AI questions" },
    { id: 5, name: "Health Champion", icon: Crown, earned: false, desc: "Earn all other badges" },
  ];

  const completed = quests.filter(q => q.completed).length;
  const totalRewards = quests.reduce((sum, q) => sum + (q.completed ? q.reward : 0), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Rewards</h1>
        <p className="text-slate-400">Stay motivated, earn points</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold text-teal-400">{points.toLocaleString()}</p>
          <p className="text-slate-400 text-xs mt-1">Total Points</p>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400 text-2xl mb-1">
            <Flame size={24} />
            <span className="font-bold">{streak}</span>
          </div>
          <p className="text-slate-400 text-xs">Day Streak</p>
        </div>
      </div>

      {/* Daily quests */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Daily Quests</h2>
          <span className="text-xs text-slate-400">{completed}/{quests.length} completed</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completed / quests.length) * 100}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
          />
        </div>

        <div className="space-y-2.5">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`p-3 rounded-xl border transition-all ${
                quest.completed
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-slate-800/30 border-slate-700/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    quest.completed ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700/50 text-slate-400"
                  }`}
                >
                  {quest.completed ? <Check size={16} /> : <Target size={16} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${quest.completed ? "text-emerald-300" : "text-white"}`}>
                    {quest.title}
                  </p>
                  <p className="text-xs text-slate-400">{quest.reward} pts</p>
                </div>
                {quest.completed && <Sparkles size={16} className="text-amber-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.id}
                whileHover={{ scale: badge.earned ? 1.02 : 1 }}
                className={`p-4 rounded-xl border text-center ${
                  badge.earned
                    ? "bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/20"
                    : "bg-slate-800/30 border-slate-700/30 opacity-60 grayscale"
                }`}
              >
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    badge.earned ? "bg-amber-500/20 text-amber-400" : "bg-slate-700/50 text-slate-500"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <p className={`font-medium text-sm ${badge.earned ? "text-white" : "text-slate-500"}`}>
                  {badge.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{badge.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
