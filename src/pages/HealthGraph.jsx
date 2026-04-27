import { motion } from 'framer-motion';

export default function HealthGraph() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Health Graph</h1>
        <p className="text-slate-400">Your complete medical history</p>
      </div>
      <div className="glass-card p-6 text-center text-slate-400">
        Health graph visualisation coming soon. Your encrypted health records will appear here.
      </div>
    </motion.div>
  );
}
