// src/pages/TrainingDashboard.jsx
// Admin: View and manage AI self-training data
import { motion } from 'framer-motion';
import { Brain, Download, RefreshCw, BarChart3 } from 'lucide-react';

export default function TrainingDashboard() {
  const stats = [
    { label: 'Total Pairs', value: '1,247', change: '+23 today' },
    { label: 'Training Cycles', value: '42', change: 'Last: 2d ago' },
    { label: 'Diversity Score', value: '87%', change: 'Good' },
    { label: 'Dataset Size', value: '5.2 MB', change: 'v3.1' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-4rem)] p-6"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Brain size={28} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Training Dashboard</h1>
              <p className="text-slate-400 text-sm">AI self-training data and model improvement metrics</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="glass-card px-4 py-2 text-slate-200 rounded-lg text-sm flex items-center gap-2 hover:border-teal-400/30">
              <Download size={16} />
              Export Dataset
            </button>
            <button className="glass-card px-4 py-2 text-slate-200 rounded-lg text-sm flex items-center gap-2 hover:border-teal-400/30">
              <RefreshCw size={16} />
              Run Training Cycle
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="glass-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{s.label}</span>
                <BarChart3 size={16} className="text-slate-500" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-xs text-slate-500">{s.change}</div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-medium text-slate-100 mb-4">Recent Training Cycles</h2>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <div>
                    <div className="text-sm font-medium text-slate-200">Cycle #{43 - i}</div>
                    <div className="text-xs text-slate-400">Pairs: {1200 - i * 100}</div>
                  </div>
                  <div className="text-xs text-slate-400">2{['d', 'h', 'm'][i]} ago</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-medium text-slate-100 mb-4">Dataset Preview</h2>
            <pre className="text-xs text-slate-300 bg-slate-900/50 p-4 rounded-lg overflow-x-auto">
{`{"prompt": "How to treat fever in children?", "completion": " Treat fever with acetaminophen...", "role": "patient", "emotionalState": "anxious"}`}
            </pre>
            <div className="mt-4 text-sm text-slate-400">
              Download full <code className="text-teal-300">vita-training-data.jsonl</code> for external fine-tuning.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
