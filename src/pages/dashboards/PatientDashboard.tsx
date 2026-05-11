import { motion } from "framer-motion";
import { TrendingUp, Activity, Heart, Pill, Target, Calendar, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { getCurrentHealthState } from "../../services/healthGraph";
import PWAInstallPrompt from "../../components/PWAInstallPrompt";
import GlassCard from "../../components/GlassCard";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

export default function PatientDashboard() {
  const health = getCurrentHealthState();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="space-y-8 p-4 pb-24 max-w-4xl mx-auto"
    >
      <header className="flex justify-between items-end">
        <div>
          <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">{today}</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Health Overview</h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-teal-400 shadow-inner">
           <Heart size={24} fill="currentColor" />
        </div>
      </header>

      {/* Quick stats */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-4"
      >
        {[
          { icon: Activity, label: "Conditions", count: health.conditions?.length || 0, color: "text-teal-400", bg: "bg-teal-500/10" },
          { icon: Pill, label: "Meds", count: health.medications?.length || 0, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { icon: Target, label: "Allergies", count: health.allergies?.length || 0, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <motion.div key={i} variants={staggerItem}>
            <GlassCard className="p-4 text-center group" depth="tight">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <p className="text-2xl font-black text-white">{stat.count}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-tighter">{stat.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Primary Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-6 border-l-4 border-l-teal-500 relative overflow-hidden group" onClick={() => {}} depth="loose">
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-teal-500/5 blur-3xl rounded-full group-hover:bg-teal-500/10 transition-colors" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
              <Sparkles size={20} />
            </div>
            <h2 className="text-lg font-bold text-white">Ask Vita AI</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Get instant medical insights, check interactions, or summarize your health records using on-device intelligence.
          </p>
          <Link to="/ai" className="btn-primary py-2 px-4 text-sm w-full">
            Open Assistant
            <ChevronRight size={16} />
          </Link>
        </GlassCard>

        <GlassCard className="p-6 border-l-4 border-l-amber-500 group" onClick={() => {}} depth="loose">
           <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Calendar size={20} />
            </div>
            <h2 className="text-lg font-bold text-white">Daily Focus</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            You have <span className="text-amber-400 font-bold">2 medications</span> scheduled for today. Don't forget to log your readings.
          </p>
          <div className="flex gap-2">
            <button className="flex-1 btn-secondary py-2 text-sm">View Schedule</button>
            <button className="flex-1 btn-primary py-2 text-sm">Log Now</button>
          </div>
        </GlassCard>
      </section>

      {/* Insights & Trends */}
      <section>
        <h3 className="text-lg font-bold text-white mb-4 px-1 flex items-center gap-2">
          <TrendingUp className="text-emerald-400" size={20} />
          Health Insights
        </h3>
        <div className="space-y-4">
          <GlassCard className="p-5 flex items-center gap-4" hover={false}>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-white font-semibold">Blood Pressure Stability</p>
              <p className="text-sm text-slate-400">Your readings have improved by <span className="text-emerald-400 font-bold">12%</span> over the past month. Keep up the good work!</p>
            </div>
          </GlassCard>
          
          <GlassCard className="p-5 flex items-center gap-4" hover={false}>
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center shrink-0">
              <Heart size={24} />
            </div>
            <div>
              <p className="text-white font-semibold">Resting Heart Rate</p>
              <p className="text-sm text-slate-400">Averaging <span className="text-indigo-400 font-bold">68 BPM</span>. This is within your target range for your age group.</p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Navigation Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Meds", icon: Pill, route: "/medications", color: "text-emerald-400" },
          { label: "Cycle", icon: Heart, route: "/cycle", color: "text-rose-400" },
          { label: "Rewards", icon: Target, route: "/rewards", color: "text-amber-400" },
          { label: "Passport", icon: ShieldCheck, route: "/passport", color: "text-teal-400" },
        ].map((item, i) => (
          <Link key={i} to={item.route}>
            <GlassCard className="p-4 flex flex-col items-center gap-2 hover:border-teal-500/30">
              <item.icon className={item.color} size={24} />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{item.label}</span>
            </GlassCard>
          </Link>
        ))}
      </section>

      <PWAInstallPrompt />
    </motion.div>
  );
}
