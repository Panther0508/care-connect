import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@clerk/clerk-react';
import { adminAuditLogger } from '@/services/adminAuditLogger';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const { user } = useAuth();
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-slate-400">Platform analytics, user management, and configuration</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-3xl font-bold text-white">573</div>
          <div className="text-sm text-slate-400">Total Users</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-3xl font-bold text-white">¥2,450</div>
          <div className="text-sm text-slate-400">Monthly Recurring Revenue</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* User Growth */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="font-semibold mb-4 text-white">User Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userGrowth}>
              <XAxis dataKey="week" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
              />
              <Bar dataKey="newUsers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Breakdown */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="font-semibold mb-4 text-white">Users by Role</h3>
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
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 flex-wrap mt-2">
            {userBreakdown.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-300">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <h3 className="font-semibold mb-4 text-white">Weekly Engagement</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={engagement}>
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
            />
            <Bar dataKey="scans" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="shares" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-2 gap-4">
        <a href="/settings" className="bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 border border-slate-700/50 transition-colors">
          <div className="text-2xl mb-2">⚙️</div>
          <div className="font-medium">Org Settings</div>
          <div className="text-xs text-slate-400">White-label & configuration</div>
        </a>
        <a href="/audit-log" className="bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 border border-slate-700/50 transition-colors">
          <div className="text-2xl mb-2">📋</div>
          <div className="font-medium">Audit Log</div>
          <div className="text-xs text-slate-400">Compliance and access logs</div>
        </a>
      </div>

      {/* Security Settings Section */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <h3 className="font-semibold mb-4 text-white">Security Status</h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${mfaEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-white">Multi-Factor Auth</span>
            </div>
            <p className="text-xs text-slate-400">
              {mfaEnabled ? 'Enabled' : 'Not enabled - required for admin access'}
            </p>
            {!mfaEnabled && (
              <a href="/admin/security" className="text-xs text-teal-400 hover:underline mt-1 inline-block">
                Enable now →
              </a>
            )}
          </div>

          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-white">Biometric Lock</span>
            </div>
            <p className="text-xs text-slate-400">
              Active on navigation (15 min timeout)
            </p>
            <a href="/settings" className="text-xs text-teal-400 hover:underline mt-1 inline-block">
              Configure →
            </a>
          </div>
        </div>

        {auditLogs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Recent Admin Activity</h4>
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-xs font-mono text-teal-300 truncate max-w-[200px]">
                        {log.action}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[200px]">
                        {log.resource}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 text-right">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
