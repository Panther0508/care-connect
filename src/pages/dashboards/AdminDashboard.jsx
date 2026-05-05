import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@clerk/clerk-react';
import { adminAuditLogger } from '@/services/adminAuditLogger';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VitaAvatar from '../../components/VitaAvatar';
import {
  Users,
  CreditCard,
  BarChart3,
  Shield,
  Fingerprint,
  FileText,
  Settings,
  AlertTriangle,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState([]);

  const isAdmin = user?.publicMetadata?.role === 'admin';
  const mfaEnabled = user?.twoFactorEnabled ?? false;

  // Load recent audit logs
  useEffect(() => {
    const loadAudit = async () => {
      if (!isAdmin) return;
      try {
        const logs = await adminAuditLogger.getLogs(5);
        setAuditLogs(logs);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      }
    };
    loadAudit();
  }, [isAdmin]);

  const metrics = [
    {
      label: "Total Users",
      value: "573",
      change: "+12%",
      icon: Users,
      color: "bg-blue-500/15 text-blue-300",
      route: "/admin",
    },
    {
      label: "Monthly Revenue",
      value: "¥2,450",
      change: "+8%",
      icon: CreditCard,
      color: "bg-emerald-500/15 text-emerald-300",
      route: "/subscription",
    },
    {
      label: "Security Status",
      value: mfaEnabled ? "Secure" : "At Risk",
      sub: mfaEnabled ? "MFA enabled" : "MFA required",
      icon: Shield,
      color: mfaEnabled ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300",
      route: "/admin/security",
    },
  ];

  const userGrowth = [
    { week: 'W1', newUsers: 120 },
    { week: 'W2', newUsers: 158 },
    { week: 'W3', newUsers: 202 },
    { week: 'W4', newUsers: 245 },
  ];

  const userBreakdown = [
    { name: 'Patients', value: 420, color: '#3b82f6' },
    { name: 'Clinicians', value: 85, color: '#10b981' },
    { name: 'CHWs', value: 56, color: '#f59e0b' },
    { name: 'Admins', value: 12, color: '#8b5cf6' },
  ];

  const engagement = [
    { day: 'Mon', scans: 34, shares: 56 },
    { day: 'Tue', scans: 45, shares: 67 },
    { day: 'Wed', scans: 29, shares: 45 },
    { day: 'Thu', scans: 51, shares: 72 },
    { day: 'Fri', scans: 38, shares: 61 },
    { day: 'Sat', scans: 22, shares: 34 },
    { day: 'Sun', scans: 18, shares: 29 },
  ];

  const alerts = [
    { id: 1, title: "MFA disabled for 3 users", severity: "high" },
    { id: 2, title: "Unusual login pattern detected", severity: "medium" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5 p-4 pb-24"
    >
      {/* Greeting */}
      <div className="flex items-center gap-4">
        <VitaAvatar state="online" size={56} />
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            Admin Dashboard
          </h1>
          <p className="text-slate-400 text-sm">Platform analytics & user management</p>
        </div>
      </div>

      {/* Quick Metrics */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <motion.button
                key={metric.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(metric.route)}
                className="relative bg-slate-800/40 rounded-2xl p-4 border border-slate-700/40 hover:border-blue-500/40 transition-all text-left"
              >
                <div className={`p-2 rounded-xl w-fit mb-2 ${metric.color}`}>
                  <Icon size={20} />
                </div>
                <div className="text-xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-xs text-slate-400 font-medium">{metric.label}</div>
                {metric.change && (
                  <div className="text-[10px] text-emerald-400 mt-1">{metric.change} this month</div>
                )}
                {metric.sub && (
                  <div className="text-[10px] text-slate-500 mt-1">{metric.sub}</div>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* User Growth */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-400" />
              User Growth
            </h2>
          </div>
          <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/40">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userGrowth}>
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                />
                <Bar dataKey="newUsers" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* User Breakdown */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">User Breakdown</h2>
          <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/40">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={userBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 flex-wrap mt-2">
              {userBreakdown.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Weekly Engagement */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Weekly Engagement</h2>
        <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/40">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={engagement}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
              />
              <Bar dataKey="scans" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="shares" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Alerts & Security */}
      {alerts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-400" />
            Security Alerts
          </h2>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              whileHover={{ x: 2 }}
              className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-red-700/30"
            >
              <div className={`p-2 rounded-lg ${alert.severity === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                <AlertTriangle size={16} />
              </div>
              <div className="flex-1 text-sm text-slate-200">{alert.title}</div>
              <ChevronRight size={16} className="text-slate-500" />
            </motion.div>
          ))}
        </section>
      )}

      {/* Admin Actions Grid */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Admin Actions</h2>
        <div className="grid grid-cols-2 gap-3">
           <motion.button
             whileTap={{ scale: 0.98 }}
             onClick={() => navigate("/settings")}
             className="glass-card hover:bg-slate-700/60 rounded-2xl p-4 border border-slate-700/40 hover:border-blue-500/40 transition-all text-left"
           >
             <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-slate-800/50 flex items-center justify-center"><Settings size={20} className="text-slate-400" /></div>
             <div className="font-medium text-white">Org Settings</div>
             <div className="text-xs text-slate-400 mt-1">White-label & configuration</div>
           </motion.button>
           <motion.button
             whileTap={{ scale: 0.98 }}
             onClick={() => navigate("/audit-log")}
             className="glass-card hover:bg-slate-700/60 rounded-2xl p-4 border border-slate-700/40 hover:border-blue-500/40 transition-all text-left"
           >
             <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-slate-800/50 flex items-center justify-center"><FileText size={20} className="text-slate-400" /></div>
             <div className="font-medium text-white">Audit Log</div>
             <div className="text-xs text-slate-400 mt-1">Compliance & access logs</div>
           </motion.button>
        </div>
      </section>

      {/* Security Status */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Security Status</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className={`bg-slate-800/40 rounded-xl p-3 border ${mfaEnabled ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${mfaEnabled ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-white">Multi-Factor Auth</span>
            </div>
            <p className="text-xs text-slate-400">
              {mfaEnabled ? 'Enabled' : 'Not enabled - required for admin access'}
            </p>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-3 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-white">Biometric Lock</span>
            </div>
            <p className="text-xs text-slate-400">Active (15 min timeout)</p>
          </div>
        </div>
      </section>

      {/* Recent Admin Activity */}
      {auditLogs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Recent Admin Activity</h2>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <motion.div
                key={log.id}
                whileHover={{ x: 2 }}
                className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="text-xs font-mono text-teal-300 truncate max-w-[200px]">
                      {log.action}
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-[200px]">{log.resource}</div>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* AI Tip for Admins */}
      <section className="bg-gradient-to-br from-slate-800/40 to-slate-700/20 rounded-2xl p-4 border border-slate-600/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
            <Sparkles size={20} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Platform Insights</div>
            <p className="text-xs text-slate-300 mt-1">
              Use the AI assistant to analyze usage patterns or draft user communications.
            </p>
            <button
              onClick={() => navigate("/ai")}
              className="mt-2 text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              Try AI Assistant <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
