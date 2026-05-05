import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { getAllAuditLogs, getFilteredAuditLogs, AuditLogEvent } from '../lib/idb';

const ITEMS_PER_PAGE = 20;

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEvent[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    userRole: '',
    action: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(true);

  const actionTypes = [
    'user_login', 'user_logout', 'data_access', 'data_modify', 
    'user_create', 'user_update', 'user_delete', 'settings_change'
  ];

  const userRoles = ['admin', 'clinician', 'chw', 'patient'];

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, logs]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await getAllAuditLogs();
      setLogs(allLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      const filterParams: any = {};
      
      if (filters.userRole) filterParams.userRole = filters.userRole;
      if (filters.action) filterParams.action = filters.action;
      if (filters.startDate) filterParams.startDate = new Date(filters.startDate).getTime();
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        filterParams.endDate = end.getTime();
      }

      const filtered = await getFilteredAuditLogs(
        Object.keys(filterParams).length > 0 ? filterParams : undefined
      );
      setFilteredLogs(filtered);
      setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to filter logs:', error);
    }
  };

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'IP Address', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.userName || log.userId,
        log.userRole,
        log.action,
        log.resource,
        log.ipAddress || '',
        log.success ? 'Success' : 'Failure'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({ userRole: '', action: '', startDate: '', endDate: '' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-medium transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-teal-400" />
          <h3 className="text-sm font-medium text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.userRole}
            onChange={(e) => setFilters({ ...filters, userRole: e.target.value })}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
          >
            <option value="">All Roles</option>
            {userRoles.map(role => (
              <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
            ))}
          </select>
          
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
          >
            <option value="">All Actions</option>
            {actionTypes.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
            placeholder="Start date"
          />
          
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
            placeholder="End date"
          />
        </div>
        
        {(filters.userRole || filters.action || filters.startDate || filters.endDate) && (
          <button
            onClick={clearFilters}
            className="mt-3 text-xs text-teal-400 hover:text-teal-300"
          >
            Clear filters
          </button>
        )}
      </GlassCard>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading audit logs...</div>
        ) : paginatedLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No audit logs found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-slate-400 font-medium">Timestamp</th>
                <th className="text-left p-3 text-slate-400 font-medium">User</th>
                <th className="text-left p-3 text-slate-400 font-medium">Action</th>
                <th className="text-left p-3 text-slate-400 font-medium">Resource</th>
                <th className="text-left p-3 text-slate-400 font-medium">IP Address</th>
                <th className="text-left p-3 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`border-t border-white/5 ${index % 2 === 0 ? 'bg-slate-800/30' : ''}`}
                >
                  <td className="p-3 text-slate-300">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 text-slate-300">
                    <div>{log.userName || log.userId.slice(0, 8)}</div>
                    <div className="text-xs text-slate-500">{log.userRole}</div>
                  </td>
                  <td className="p-3 text-slate-300">{log.action}</td>
                  <td className="p-3 text-slate-300">{log.resource}</td>
                  <td className="p-3 text-slate-400 text-xs">{log.ipAddress || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      log.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {log.success ? 'Success' : 'Failure'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <div className="text-xs text-slate-400">
              Page {currentPage} of {totalPages} ({filteredLogs.length} records)
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-800/50 text-slate-300 disabled:opacity-50 hover:bg-slate-700/50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-800/50 text-slate-300 disabled:opacity-50 hover:bg-slate-700/50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}