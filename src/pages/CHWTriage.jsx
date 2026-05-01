// src/pages/CHWTriage.jsx
// Community Health Worker triage assistant
import { motion } from 'framer-motion';
import { Stethoscope, AlertTriangle, MessageSquare, MapPin } from 'lucide-react';

export default function CHWTriage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-4rem)] p-6"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Stethoscope size={28} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">CHW Triage</h1>
            <p className="text-slate-400 text-sm">AI-powered patient triage for community health workers</p>
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <AlertTriangle className="text-amber-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-medium text-slate-100 mb-1">Danger Sign Detection</h3>
                <p className="text-sm text-slate-400">AI will analyze symptoms and flag emergency indicators</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Patient Age</label>
                <input type="number" placeholder="Age" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                <select className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                  <option>Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Presenting Symptoms</label>
                <textarea rows={4} placeholder="Describe symptoms, duration, severity..." className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button className="glass-card px-6 py-2.5 text-slate-200 rounded-xl text-sm font-medium transition-all hover:border-teal-400/30 flex items-center gap-2">
                <MessageSquare size={16} />
                Analyze with Vita
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
