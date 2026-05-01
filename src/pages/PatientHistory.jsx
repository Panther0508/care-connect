// src/pages/PatientHistory.jsx
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import { FileText, Calendar, Pill, Heart } from 'lucide-react';

export default function PatientHistory() {
  const { user } = useAuth();
  const userName = user?.firstName || 'there';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-4rem)] p-6"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <FileText size={28} className="text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Health History</h1>
            <p className="text-slate-400 text-sm">Complete medical timeline for {userName}</p>
          </div>
        </div>

        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-medium text-slate-100 mb-4">Your Medical Journey</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-6">
            This page will display your full health history including diagnoses, medications, lab results, and encounter notes.
          </p>
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">0</div>
              <div className="text-sm text-slate-500">Conditions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">0</div>
              <div className="text-sm text-slate-500">Medications</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">0</div>
              <div className="text-sm text-slate-500">Encounters</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
