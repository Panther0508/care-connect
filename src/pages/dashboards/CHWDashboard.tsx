import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Users, ClipboardList, Activity, TrendingUp, MapPin, Sparkles, ChevronRight, AlertCircle, Clock } from "lucide-react";
import GlassCard from "../../components/GlassCard";

const STATS = [
  { label: "Patients", value: 48, icon: Users, color: "text-teal-400", bg: "bg-teal-500/10" },
  { label: "Visits", value: 12, icon: ClipboardList, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { label: "High Priority", value: 3, icon: Activity, color: "text-rose-400", bg: "bg-rose-500/10" },
  { label: "Target", value: "85%", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
];

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

export default function CHWDashboard() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="space-y-8 p-4 pb-24 max-w-4xl mx-auto"
    >
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Worker Hub</h1>
        <p className="text-slate-400 font-medium">Monitoring community health in real-time.</p>
      </header>

      {/* Stats grid */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {STATS.map((stat, i) => (
          <motion.div key={i} variants={staggerItem}>
            <GlassCard className="p-4 group" depth="tight">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{stat.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Triage & AI Tools */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white px-1 flex items-center gap-2">
          <Sparkles className="text-teal-400" size={20} />
          AI Intelligence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="p-6 border-l-4 border-l-cyan-500 relative overflow-hidden group" depth="loose">
             <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
             <h3 className="text-lg font-bold text-white mb-2">Smart Assistant</h3>
             <p className="text-sm text-slate-400 mb-6">Analyze patient data or get clinical guidance using on-device medical AI.</p>
             <NavLink to="/ai" className="btn-primary py-2 px-4 text-sm w-full flex items-center justify-center gap-2">
               Launch Assistant
               <ChevronRight size={16} />
             </NavLink>
          </GlassCard>

          <GlassCard className="p-6 border-l-4 border-l-teal-500 group" depth="loose">
             <h3 className="text-lg font-bold text-white mb-2">Rapid Triage</h3>
             <p className="text-sm text-slate-400 mb-6">Perform high-speed community screening and risk assessment for outbreaks.</p>
             <NavLink to="/chw-triage" className="btn-secondary py-2 px-4 text-sm w-full flex items-center justify-center gap-2">
               Start Triage
               <ChevronRight size={16} />
             </NavLink>
          </GlassCard>
        </div>
      </section>

      {/* Today's Tasks */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white px-1 flex items-center gap-2">
          <Clock className="text-indigo-400" size={20} />
          Scheduled Visits
        </h2>
        <GlassCard className="divide-y divide-white/5" depth="none">
          {[
            { patient: "Amina Ibrahim", task: "Blood pressure check", time: "10:00 AM", urgent: true },
            { patient: "Chinedu Okafor", task: "Medication delivery", time: "2:00 PM", urgent: false },
            { patient: "Fatima Aliyu", task: "Pregnancy visit", time: "4:30 PM", urgent: true },
          ].map((task, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-teal-400 group-hover:border-teal-500/30 transition-all">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="font-bold text-white">{task.patient}</p>
                  <p className="text-sm text-slate-400">{task.task}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{task.time}</p>
                {task.urgent && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                    Urgent
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </GlassCard>
      </section>

      {/* High Priority Alerts */}
      <section>
        <GlassCard className="p-4 bg-amber-500/5 border-amber-500/20 flex items-start gap-4" hover={false}>
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-amber-300 font-bold mb-1">Attention Required</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Two patients in your assigned zone missed their last visit. Consider scheduling a follow-up call immediately.
            </p>
          </div>
        </GlassCard>
      </section>
    </motion.div>
  );
}
