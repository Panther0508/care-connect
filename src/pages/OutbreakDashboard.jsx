import { motion } from 'framer-motion';

export default function OutbreakDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Outbreak Dashboard</h1>
        <p className="text-slate-400">Mesh network health intelligence</p>
      </div>
      <div className="glass-card p-6 text-center text-slate-400">
        Outbreak monitoring and alerts coming soon. Track disease spread in your community.
      </div>
    </motion.div>
  );
}
