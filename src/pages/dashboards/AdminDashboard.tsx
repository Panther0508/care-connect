import { motion } from "framer-motion";
import { Users, FileText, AlertTriangle, Eye, Settings, Database } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

const ADMIN_STATS = [
  { label: "Total Users", value: "1,247", icon: Users, trend: "+12%", color: "text-teal-400" },
  { label: "Active Sessions", value: "386", icon: Eye, trend: "+5%", color: "text-cyan-400" },
  { label: "Audit Events", value: "12,404", icon: FileText, trend: "+8%", color: "text-amber-400" },
  { label: "System Health", value: "99.9%", icon: Database, trend: "stable", color: "text-emerald-400" },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-base text-slate-300">System overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {ADMIN_STATS.map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className={`${stat.color} mb-2`}>
              <stat.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-slate-300 text-sm">{stat.label}</span>
              {stat.trend === "stable" ? (
                <span className="text-slate-400 text-sm">• {stat.trend}</span>
              ) : (
                <span className="text-emerald-400 text-sm">↑ {stat.trend}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Admin quick actions */}
      <div className="grid sm:grid-cols-2 gap-3">
        <a href="/audit-log" className="glass-card p-4 hover:border-teal-500/30 transition-all">
          <Settings className="text-teal-400 mb-2" size={20} />
          <h3 className="font-medium text-white">Audit Log</h3>
           <p className="text-sm text-slate-300 mt-1">System event history</p>
        </a>
        <a href="/training" className="glass-card p-4 hover:border-teal-500/30 transition-all">
          <Users className="text-amber-400 mb-2" size={20} />
          <h3 className="font-medium text-white">Training</h3>
           <p className="text-sm text-slate-300 mt-1">Assign learning modules</p>
        </a>
      </div>

      {/* Alerts */}
      <div className="glass-card p-4 border-rose-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-rose-400 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-slate-300">
            <p className="font-medium text-rose-300 mb-1">Security Notice</p>
            <p>3 users failed MFA in the last hour. Review the audit log for details.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
