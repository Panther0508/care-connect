import { usePassport } from '../../hooks/usePassport';
import { useMesh } from '../../hooks/useMesh';
import { useTranslation } from '../../services/translation/useTranslation';
import { motion } from 'framer-motion';

export default function ClinicianDashboard() {
  const { t } = useTranslation();
  const { recentScans } = usePassport();
  const { meshStats } = useMesh();

  const stats = [
    { label: 'Patients Scanned', value: recentScans.length, icon: '👥' },
    { label: 'Pending Reviews', value: 3, icon: '📋' }, // placeholder
    { label: 'Notes Added', value: 12, icon: '📝' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Clinician Dashboard</h1>
        <p className="text-slate-400">Patient management and scan history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Scans */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Recent Scans</h2>
          <button className="text-sm text-teal-400">View All</button>
        </div>
        {recentScans.length > 0 ? (
          <div className="space-y-2">
            {recentScans.slice(0, 5).map((scan) => (
              <motion.div
                key={scan.id}
                whileHover={{ scale: 1.01 }}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-white">Patient {scan.patientDid.slice(0, 12)}...</div>
                    <div className="text-xs text-slate-400">
                      {new Date(scan.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-xs capitalize">
                    {scan.specialistType || 'General'}
                  </div>
                </div>
                {scan.summary && (
                  <p className="mt-2 text-sm text-slate-300 line-clamp-2">{scan.summary}</p>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700/50">
            <p className="text-slate-400 mb-3">No patient scans yet.</p>
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors">
              Scan a Passport
            </button>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3">
        <a href="/clinician-view" className="bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 text-center border border-slate-700/50 transition-colors">
          <div className="text-2xl mb-2">📷</div>
          <div className="font-medium">Scan QR Code</div>
        </a>
        <a href="/health" className="bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 text-center border border-slate-700/50 transition-colors">
          <div className="text-2xl mb-2">👨‍⚕️</div>
          <div className="font-medium">My Profile</div>
        </a>
      </section>
    </motion.div>
  );
}
