import { useMesh } from '../../hooks/useMesh';
import { useSavedNeeds } from '../../hooks/useSavedNeeds';
import { useTranslation } from '../../services/translation/useTranslation';
import { motion } from 'framer-motion';

export default function CHWDashboard() {
  const { t } = useTranslation();
  const { meshStats, facilityConfirmations } = useMesh();
  const { needs } = useSavedNeeds();

  const alerts = [
    { id: 1, type: 'Cholera', severity: 'high', location: 'Kano', cases: 12 },
    { id: 2, type: 'Malaria', severity: 'medium', location: 'Lagos', cases: 45 },
  ];

  const stats = [
    { label: 'Mesh Syncs', value: meshStats?.searchCount || 0, icon: '📡' },
    { label: 'Facilities', value: facilityConfirmations.length, icon: '🏥' },
    { label: 'Needs Logged', value: needs.length, icon: '📋' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">CHW Dashboard</h1>
        <p className="text-slate-400">Mesh intelligence and community health monitoring</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
          <div className="text-2xl mb-1">📡</div>
          <div className="text-xl font-bold">{meshSyncCount}</div>
          <div className="text-xs text-slate-400">Mesh Syncs</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
          <div className="text-2xl mb-1">🏥</div>
          <div className="text-xl font-bold">{facilityConfirmations}</div>
          <div className="text-xs text-slate-400">Facilities</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
          <div className="text-2xl mb-1">📋</div>
          <div className="text-xl font-bold">{needs.length}</div>
          <div className="text-xs text-slate-400">Needs Logged</div>
        </div>
      </div>

      {/* Outbreak Alerts */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Outbreak Alerts</h2>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              whileHover={{ scale: 1.02 }}
              className={`rounded-xl p-4 border ${
                alert.severity === 'high'
                  ? 'bg-red-900/30 border-red-700'
                  : 'bg-yellow-900/30 border-yellow-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{alert.type} Alert</h3>
                  <p className="text-sm text-slate-300">{alert.location} — {alert.cases} cases</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs capitalize ${
                  alert.severity === 'high' ? 'bg-red-600' : 'bg-yellow-600'
                }`}>
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
          <a href="/register-need" className="text-sm text-teal-400">Add New</a>
        </div>
        {needs.length > 0 ? (
          <div className="space-y-2">
            {needs.slice(0, 4).map((need) => (
              <div key={need.timestamp} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <p className="text-slate-200 text-sm">{need.text}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(need.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700/50">
            <p className="text-slate-400">No community needs registered yet.</p>
          </div>
        )}
      </section>

      {/* Facility Confirmations */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Recent Facilities Confirmed</h2>
        <div className="space-y-2">
          {facilityConfirmations.slice(0, 5).map((facility, idx) => (
            <div key={idx} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex justify-between items-center">
              <span className="text-slate-200 text-sm">{facility}</span>
              <span className="text-green-400 text-xs">✓</span>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
