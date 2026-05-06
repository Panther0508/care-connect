import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Users, ClipboardList, Activity, TrendingUp, MapPin, Sparkles } from "lucide-react";

const STATS = [
  { label: "Patients Assigned", value: 48, icon: Users, color: "text-teal-400" },
  { label: "Visits This Week", value: 12, icon: ClipboardList, color: "text-cyan-400" },
  { label: "High Priority", value: 3, icon: Activity, color: "text-rose-400" },
  { label: "Monthly Target", value: "85%", icon: TrendingUp, color: "text-emerald-400" },
];

export default function CHWDashboard() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">CHW Dashboard</h1>
        <p className="text-slate-400 text-sm">Welcome back! Here's your daily overview.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className={`${stat.color} mb-2`}>
              <stat.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
             <p className="text-base text-slate-400">{stat.label}</p>
          </div>
        ))}
        </div>

       {/* Quick actions */}
       <div className="space-y-3">
         <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
         <div className="flex flex-wrap gap-2">
           <NavLink
             to="/ai"
             className="glass-card px-4 py-2 rounded-xl text-base font-medium text-cyan-400 hover:border-cyan-500/25 hover:text-cyan-300 transition-all flex items-center gap-2"
           >
             <Sparkles size={16} />
             AI Assistant
           </NavLink>
           <NavLink
             to="/chw-triage"
             className="glass-card px-4 py-2 rounded-xl text-base font-medium text-teal-400 hover:border-teal-500/25 hover:text-teal-300 transition-all flex items-center gap-2"
           >
             <Sparkles size={16} />
             AI Triage
           </NavLink>
         </div>
       </div>

      {/* Today's Tasks */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Today's Tasks</h2>
        <div className="glass-card divide-y divide-white/5">
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
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                  <MapPin size={16} className="text-teal-400" />
                </div>
                <div>
                   <p className="font-medium text-white text-base">{task.patient}</p>
                   <p className="text-sm text-slate-400">{task.task}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">{task.time}</p>
                {task.urgent && (
                   <span className="text-sm text-rose-400">Urgent</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <Activity className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
           <div className="text-sm text-slate-300">
            <p className="font-medium text-amber-300 mb-1">Notice</p>
            <p>Two patients missed their last visit. Consider rescheduling or phone follow-up.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
