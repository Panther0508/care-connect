import { motion } from "framer-motion";
import { Award, Sparkles, Target, Flame } from "lucide-react";

export default function RewardsPage() {
  const points = 2450;
  const streak = 7;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Rewards</h1>
        <p className="text-slate-400">Earn points for healthy habits</p>
      </div>

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

      <div className="glass-card p-6 text-center">
        <Award className="text-amber-400 mx-auto mb-3" size={40} />
        <h2 className="text-lg font-semibold text-white mb-2">Next Reward</h2>
        <p className="text-slate-400 text-sm mb-4">Complete 3 more quests to unlock the "Health Champion" badge.</p>
        <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} className="h-full bg-gradient-to-r from-amber-500 to-orange-500" />
        </div>
        <p className="text-xs text-slate-500 mt-2">6/9 quests completed</p>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-white mb-3">How to Earn</h2>
        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-center gap-3">
            <Target className="text-teal-400" size={16} />
            <span>Complete daily quests → +50 to +150 pts each</span>
          </li>
          <li className="flex items-center gap-3">
            <Flame className="text-amber-400" size={16} />
            <span>Maintain streaks → bonus multipliers</span>
          </li>
          <li className="flex items-center gap-3">
            <Sparkles className="text-cyan-400" size={16} />
            <span>Earn badges → permanent profile decorations</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
}
