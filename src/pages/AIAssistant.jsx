import { motion } from 'framer-motion';

export default function AIAssistant() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">AI Assistant</h1>
        <p className="text-slate-400">Ask questions about your health</p>
      </div>
      <div className="glass-card p-6 text-center text-slate-400">
        On-device AI chat coming soon. Ask about medications, conditions, and symptoms.
      </div>
    </motion.div>
  );
}
