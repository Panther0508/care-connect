import { useState } from 'react';
import { motion } from 'framer-motion';

function getTimeAgo(date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Mock audit logs - in production, these would come from the audit trail service
const mockAuditLogs = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actorDid: 'did:key:z6MkhaXgBZD3t8AMk1d24t5YbpgpLkQq7u2qY1qo2f2xD',
    action: 'health_graph.read',
    resource: 'Patient health record',
    ip: '102.89.12.45',
    userAgent: 'VitaChain/1.0 (Android 14)',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    actorDid: 'did:key:z6MkhaXgBZD3t8AMk1d24t5YbpgpLkQq7u2qY1qo2f2xD',
    action: 'passport.generate',
    resource: 'QR credential for cardiologist',
    ip: '102.89.12.45',
    userAgent: 'VitaChain/1.0 (Android 14)',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    actorDid: 'did:key:z6Mk...admin',
    action: 'user.manage',
    resource: 'User account creation',
    ip: '105.22.78.90',
    userAgent: 'VitaChain/1.0 (Web)',
  },
];

export default function AuditLog() {
  const [logs] = useState(mockAuditLogs);
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = !filter || 
      log.resource.toLowerCase().includes(filter.toLowerCase()) ||
      log.actorDid.toLowerCase().includes(filter.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Audit Log</h1>
        <p className="text-slate-400">Compliance: track all access to health data</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 min-w-[200px] bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500 text-white"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
        >
          <option value="">All Actions</option>
          <option value="health_graph.read">Read Health Graph</option>
          <option value="health_graph.write">Write Health Graph</option>
          <option value="passport.generate">Generate Passport</option>
          <option value="passport.scan">Scan Passport</option>
          <option value="user.manage">User Management</option>
        </select>
      </div>

      <div className="space-y-2">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
          >
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div>
                <div className="font-medium text-white capitalize">
                  {log.action.replace('.', ' → ')}
                </div>
                <div className="text-sm text-slate-400 mt-1">{log.resource}</div>
                <div className="text-xs text-slate-500 font-mono mt-1 break-all">
                  Actor: {log.actorDid.slice(0, 32)}...
                </div>
              </div>
                <div className="text-right text-sm text-slate-400">
                <div>{new Date(log.timestamp).toLocaleString()}</div>
                <div className="text-xs text-slate-500">
                  {getTimeAgo(log.timestamp)}
                </div>
                <div className="text-xs text-slate-500 mt-1">{log.ip}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No audit logs match your filters.
        </div>
      )}
    </motion.div>
  );
}
