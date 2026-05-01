import { useMesh } from '../../hooks/useMesh';
import { useSavedNeeds } from '../../hooks/useSavedNeeds';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useNavigate, useState } from 'react-router-dom';
import VitaAvatar from '../../components/VitaAvatar';
import {
  Wifi,
  Building2,
  ClipboardList,
  AlertTriangle,
  Map,
  UserPlus,
  Activity,
  CheckCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Loader2,
  Send,
  Bot
} from 'lucide-react';
import { getOutbreakAlerts, getNearbyFacilities, invalidateCache } from '../../services/realtimeData';
import { processCHWQuery } from '../../services/chwAI';

export default function CHWDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { meshStats, facilityConfirmations } = useMesh();
  const { needs, loading: needsLoading } = useSavedNeeds();

  const userName = user?.firstName || "Community Health Worker";

  // Outbreak alerts (static for now)
  const alerts = [
    { id: 1, type: "Cholera", severity: "high", location: "Kano", cases: 12 },
    { id: 2, type: "Malaria", severity: "medium", location: "Lagos", cases: 45 },
  ];

  const stats = [
    {
      label: "Mesh Syncs",
      value: meshStats?.searchCount || 0,
      icon: Wifi,
      color: "bg-emerald-500/15 text-emerald-300",
    },
    {
      label: "Facilities",
      value: facilityConfirmations.length,
      icon: Building2,
      color: "bg-blue-500/15 text-blue-300",
    },
    {
      label: "Needs Logged",
      value: needs.length,
      icon: ClipboardList,
      color: "bg-amber-500/15 text-amber-300",
    },
  ];

  const quickActions = [
    { label: "Outbreak Map", icon: Map, route: "/outbreak", color: "from-rose-500/20 to-amber-600/20" },
    { label: "Register Need", icon: UserPlus, route: "/register-need", color: "from-blue-500/20 to-blue-600/20" },
    { label: "View Mesh Activity", icon: Activity, route: "/outbreak", color: "from-emerald-500/20 to-emerald-600/20" },
  ];

  // CHW AI Triage state
  const [chwQuery, setChwQuery] = useState('');
  const [chwResponse, setChwResponse] = useState('');
  const [chwLoading, setChwLoading] = useState(false);

  const handleCHWAsk = async (e) => {
    e?.preventDefault();
    if (!chwQuery.trim()) return;
    setChwLoading(true);
    try {
      const result = await processCHWQuery(chwQuery);
      setChwResponse(result.text);
    } catch (err) {
      console.error('CHW AI error:', err);
      setChwResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setChwLoading(false);
    }
  };

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
            Hello, {userName}
          </h1>
          <p className="text-slate-400 text-sm">Mesh intelligence & community monitoring</p>
        </div>
      </div>

      {/* Stats */}
      <section className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.button
                key={stat.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card relative p-4 hover:border-emerald-500/40 transition-all text-left"
              >
                <div className={`p-2 rounded-xl w-fit mb-2 ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Outbreak Alerts */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-400" />
          Outbreak Alerts
        </h2>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              whileHover={{ scale: 1.01 }}
              className={`glass-card ${
                alert.severity === "high"
                  ? "bg-red-900/20 border-red-700/30"
                  : "bg-yellow-900/20 border-yellow-700/30"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white">{alert.type} Alert</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    {alert.location} — {alert.cases} cases reported
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs capitalize ${
                    alert.severity === "high" ? "bg-red-600/70 text-red-100" : "bg-yellow-600/70 text-yellow-100"
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Community Needs */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Registered Needs</h2>
          <button
            onClick={() => navigate("/register-need")}
            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            Add New <ChevronRight size={12} />
          </button>
        </div>
        {needsLoading ? (
          <div className="space-y-2">
            {[1,2].map(i => (
              <div key={i} className="skeleton-card h-20 rounded-xl" />
            ))}
          </div>
        ) : needs.length > 0 ? (
          <div className="space-y-2">
            {needs.slice(0, 4).map((need, idx) => (
              <motion.div
                key={idx}
                whileHover={{ x: 2 }}
                className="glass-card p-3"
              >
                <p className="text-sm text-slate-200">{need.text}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                  <Clock size={10} />
                  {new Date(need.timestamp).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card bg-slate-800/40 rounded-xl p-6 text-center border border-slate-700/40">
            <VitaAvatar state="empty" size={48} />
            <p className="text-slate-400 mt-3 text-sm">No community needs registered yet.</p>
            <button
              onClick={() => navigate("/register-need")}
              className="mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm transition-colors"
            >
              Register a Need
            </button>
          </div>
        )}
      </section>

      {/* Facilities Confirmed */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Recent Facilities Confirmed</h2>
        <div className="space-y-2">
          {facilityConfirmations.slice(0, 5).map((facility, idx) => (
            <motion.div
              key={idx}
              whileHover={{ x: 2 }}
              className="glass-card flex items-center justify-between p-3"
            >
              <span className="text-sm text-slate-200 truncate">{facility}</span>
              <CheckCircle className="text-emerald-400" size={16} />
            </motion.div>
          ))}
          {facilityConfirmations.length === 0 && (
            <div className="glass-card text-center py-6 text-slate-500 text-sm">No facilities confirmed yet</div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.route)}
                className={`flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${action.color} border border-white/5 hover:border-emerald-500/40 transition-all min-w-[100px]`}
              >
                <Icon size={24} className="text-white" />
                <span className="text-xs font-medium text-white text-center">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* CHW AI Triage Assistant */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bot size={20} className="text-cyan-400" />
          CHW Assistant
        </h2>
        <div className="glass-card p-4 space-y-3">
          <form onSubmit={handleCHWAsk} className="flex gap-2">
            <input
              type="text"
              value={chwQuery}
              onChange={(e) => setChwQuery(e.target.value)}
              placeholder="Ask about symptoms, protocols..."
              disabled={chwLoading}
              className="flex-1 glass-input py-2 px-3 text-sm"
            />
            <button type="submit" disabled={chwLoading || !chwQuery.trim()} className="btn-primary py-2 px-3">
              {chwLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
          {chwResponse && (
            <div className="bg-slate-900/40 rounded-xl p-3 text-sm text-slate-200 border border-slate-700/30">
              {chwResponse}
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
