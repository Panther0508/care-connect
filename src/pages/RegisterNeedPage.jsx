import { motion } from 'framer-motion';

export default function RegisterNeedPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Register a Need</h1>
        <p className="text-slate-400">Tell the community about your healthcare needs</p>
      </div>
      <div className="glass-card p-6 text-center text-slate-400">
        Need registration form coming soon. Describe what medical care you need.
      </div>
    </motion.div>
  );
}
