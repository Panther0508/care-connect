import { useHealthGraph } from '../../hooks/useHealthGraph';
import { usePassport } from '../../hooks/usePassport';
import { useTranslation } from '../../services/translation/useTranslation';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
}

const PageWrapper = ({ children }: PageWrapperProps) => (
  <motion.div
    initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

export default function PatientDashboard() {
  const { t } = useTranslation();
  const { conditions, medications, allergies } = useHealthGraph();
  const { recentShares } = usePassport();

  const stats = [
    { label: 'Conditions', value: conditions.length, icon: '🏥', color: 'bg-red-500/20 text-red-300' },
    { label: 'Active Medications', value: medications.length, icon: '💊', color: 'bg-blue-500/20 text-blue-300' },
    { label: 'Known Allergies', value: allergies.length, icon: '⚠️', color: 'bg-amber-500/20 text-amber-300' },
    { label: 'Passport Shares', value: recentShares.length, icon: '📤', color: 'bg-green-500/20 text-green-300' },
  ];

  const quickActions = [
    { label: 'Share with Clinician', icon: '🔗', href: '/passport' },
    { label: 'Check Medications', icon: '💊', href: '/ai', description: 'Ask about interactions' },
    { label: 'Update Health Graph', icon: '✏️', href: '/health' },
    { label: 'Register a Need', icon: '🙏', href: '/register-need' },
  ];

  return (
    <PageWrapper>
      <div className="space-y-6 p-4 pb-24">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400">Your health at a glance</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Recent Health Summary</h2>
          {conditions.length > 0 ? (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="mb-3">
                <label className="text-sm text-slate-400 block mb-1">Conditions</label>
                <div className="flex flex-wrap gap-2">
                  {conditions.map((c, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-700 rounded-full text-sm">{c.name || c}</span>
                  ))}
                </div>
              </div>
              {medications.length > 0 && (
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Medications</label>
                  <div className="flex flex-wrap gap-2">
                    {medications.map((m, i) => (
                      <span key={i} className="px-3 py-1 bg-teal-700/50 rounded-full text-sm">{m.name || m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-center">
              <p className="text-slate-400 mb-3">No health profile data yet.</p>
              <a href="/health" className="text-teal-400 hover:underline">
                Add your health information
              </a>
            </div>
          )}
        </section>

        {recentShares.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Recent Passport Shares</h2>
            <div className="space-y-2">
              {recentShares.slice(0, 3).map((share) => (
                <div key={share.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-white capitalize">{share.specialistType}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(share.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-green-400 text-sm">✓ Shared</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Suggested Actions</h2>
          <div className="bg-gradient-to-br from-teal-900/40 to-cyan-900/40 rounded-xl p-4 border border-teal-700/30">
            <p className="text-slate-200 mb-2">💡 AI Insight</p>
            <p className="text-sm text-slate-300">
              Based on your profile, consider scheduling a follow-up with your primary care physician
              for routine blood work.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <motion.a
                key={action.label}
                href={action.href}
                whileTap={{ scale: 0.98 }}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-teal-500/50 transition-colors text-center"
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="font-medium text-white text-sm">{action.label}</div>
                {action.description && (
                  <div className="text-xs text-slate-400 mt-1">{action.description}</div>
                )}
              </motion.a>
            ))}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
