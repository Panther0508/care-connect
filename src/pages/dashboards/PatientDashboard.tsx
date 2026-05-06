import { motion } from "framer-motion";
import { TrendingUp, Activity, Heart, Pill, Target } from "lucide-react";
import { getCurrentHealthState } from "../../services/healthGraph";
import PWAInstallPrompt from "../../components/PWAInstallPrompt";

export default function PatientDashboard() {
  const health = getCurrentHealthState();

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <p className="text-slate-400 text-sm">{today}</p>
        <h1 className="text-2xl font-bold text-white mb-1">Your Health</h1>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <Activity className="text-teal-400 mx-auto mb-2" size={24} />
          <p className="text-xl font-bold text-white">{health.conditions?.length || 0}</p>
           <p className="text-base text-slate-400">Conditions</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Pill className="text-emerald-400 mx-auto mb-2" size={24} />
          <p className="text-xl font-bold text-white">{health.medications?.length || 0}</p>
           <p className="text-base text-slate-400">Medications</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Target className="text-amber-400 mx-auto mb-2" size={24} />
          <p className="text-xl font-bold text-white">{health.allergies?.length || 0}</p>
           <p className="text-base text-slate-400">Allergies</p>
        </div>
      </div>

      {/* Goal card */}
      <div className="glass-card p-5 border-l-4 border-teal-500/40">
        <div className="flex items-center gap-2 mb-3">
          <Target className="text-teal-400" size={18} />
          <h2 className="font-semibold text-white">Today's Goal</h2>
        </div>
        <p className="text-slate-300 text-sm mb-3">
          Log your blood pressure and take your medication on time.
        </p>
        <button className="text-base text-teal-400 hover:underline">Mark complete</button>
      </div>

      {/* Insights */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="text-emerald-400" size={18} />
          Health Insights
        </h2>
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <p className="text-sm text-slate-200">Your blood pressure readings have improved by 12% over the past month.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <p className="text-sm text-slate-200">Medication adherence this week: <span className="text-emerald-400 font-medium">85%</span></p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <a href="/medications" className="glass-card p-4 hover:border-teal-500/30 transition-all text-center">
          <Pill className="text-teal-400 mx-auto mb-2" size={20} />
           <p className="text-base font-medium text-white">Meds</p>
        </a>
        <a href="/ai" className="glass-card p-4 hover:border-teal-500/30 transition-all text-center">
          <Activity className="text-cyan-400 mx-auto mb-2" size={20} />
           <p className="text-base font-medium text-white">Ask AI</p>
        </a>
        <a href="/cycle" className="glass-card p-4 hover:border-teal-500/30 transition-all text-center">
          <Heart className="text-rose-400 mx-auto mb-2" size={20} />
           <p className="text-base font-medium text-white">Cycle</p>
        </a>
        <a href="/rewards" className="glass-card p-4 hover:border-teal-500/30 transition-all text-center">
          <Target className="text-amber-400 mx-auto mb-2" size={20} />
           <p className="text-base font-medium text-white">Rewards</p>
        </a>
       </div>

       {/* PWA Install Prompt */}
       <PWAInstallPrompt />
     </motion.div>
  );
}
