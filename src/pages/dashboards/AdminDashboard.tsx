import { motion } from "framer-motion";
import { Users, FileText, AlertTriangle, Eye, Settings, Database, Activity, ShieldCheck, Cpu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import GlassCard from "../../components/GlassCard";
import { getQuotaRemaining } from "../../services/aiCoreRouter";

const ADMIN_STATS = [
  { label: "Total Users", value: "1,247", icon: Users, trend: "+12%", color: "text-teal-400", bg: "bg-teal-500/10" },
  { label: "Sessions", value: "386", icon: Eye, trend: "+5%", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { label: "Audit Logs", value: "12.4k", icon: FileText, trend: "+8%", color: "text-amber-400", bg: "bg-amber-500/10" },
  { label: "System Load", value: "24%", icon: Cpu, trend: "stable", color: "text-emerald-400", bg: "bg-emerald-500/10" },
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [aiStatus, setAiStatus] = useState({ online: true, quota: { used: 0, remaining: 0 } });

  useEffect(() => {
    const updateStatus = () => {
      setAiStatus({
        online: navigator.onLine,
        quota: getQuotaRemaining()
      });
    };
    updateStatus();
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="space-y-8 p-4 pb-24 max-w-4xl mx-auto"
    >
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">System Control</h1>
        <p className="text-slate-400 font-medium">Enterprise administration & monitoring.</p>
      </header>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {ADMIN_STATS.map((stat, i) => (
          <motion.div key={i} variants={staggerItem}>
            <GlassCard className="p-4 group" depth="tight">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.label}</span>
                <span className={`text-[10px] font-black ${stat.trend === "stable" ? "text-slate-500" : "text-emerald-400"}`}>
                  {stat.trend}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Operations */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white px-1 flex items-center gap-2">
          <Activity className="text-teal-400" size={20} />
          Operations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/audit-log">
            <GlassCard className="p-6 border-l-4 border-l-teal-500 group" depth="loose">
              <div className="flex items-center justify-between mb-4">
                <Settings className="text-teal-400 group-hover:rotate-90 transition-transform" size={24} />
                <span className="text-[10px] font-black text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded uppercase">Logs</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Audit Control</h3>
              <p className="text-sm text-slate-400">Monitor system events, user actions, and security protocols.</p>
            </GlassCard>
          </Link>
          <Link to="/training">
            <GlassCard className="p-6 border-l-4 border-l-amber-500 group" depth="loose">
              <div className="flex items-center justify-between mb-4">
                <ShieldCheck className="text-amber-400 group-hover:scale-110 transition-transform" size={24} />
                <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Compliance</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Training Modules</h3>
              <p className="text-sm text-slate-400">Manage clinician certifications and staff educational content.</p>
            </GlassCard>
          </Link>
        </div>
      </section>


      {/* AI System Check */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white px-1 flex items-center gap-2">
          <Cpu className="text-cyan-400" size={20} />
          AI Orchestration Status
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <GlassCard className="p-6 relative overflow-hidden group" depth="loose">
            <div className="absolute top-0 right-0 p-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${aiStatus.online ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                <span className={`w-2 h-2 rounded-full ${aiStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                {aiStatus.online ? 'Gemini 2.0 Online' : 'Offline Mode'}
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <h3 className="text-xl font-black text-white mb-2">VitaChain Hybrid Engine</h3>
                  <p className="text-sm text-slate-400">Monitoring real-time API health and parallel execution logs.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-500/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">API Quota</p>
                    <p className="text-lg font-black text-white">{aiStatus.quota.remaining} <span className="text-xs text-slate-500">Left</span></p>
                  </div>
                  <div className="p-3 bg-slate-500/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Judge Engine</p>
                    <p className="text-lg font-black text-cyan-400">Active</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-48 h-24 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl border border-white/5 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="flex gap-1 justify-center mb-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="w-1.5 h-6 bg-cyan-400/20 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ height: ["20%", "80%", "40%", "90%", "30%"] }}
                          transition={{ repeat: Infinity, duration: 1 + i*0.2, ease: "easeInOut" }}
                          className="w-full bg-cyan-400" 
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-cyan-400 font-black uppercase tracking-tighter">Engine Pulse</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
      <section>
        <GlassCard className="p-4 bg-rose-500/5 border-rose-500/20 flex items-start gap-4" hover={false}>
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-rose-300 font-bold mb-1">Security Anomaly</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              3 users failed MFA in the last hour. Potential brute force attempt detected. Review security logs immediately.
            </p>
          </div>
        </GlassCard>
      </section>
    </motion.div>
  );
}
