// src/pages/ReferralGenerator.jsx
// Clinician tool: Generate structured patient referral
import { motion } from 'framer-motion';
import { FileText, Send, User, Stethoscope } from 'lucide-react';

export default function ReferralGenerator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-4rem)] p-6"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <FileText size={28} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Referral Generator</h1>
            <p className="text-slate-400 text-sm">Create structured referrals for specialists</p>
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Patient Name</label>
              <input type="text" placeholder="Enter patient name" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Specialist Type</label>
              <select className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                <option>Cardiologist</option>
                <option>Endocrinologist</option>
                <option>Neurologist</option>
                <option>Orthopedic</option>
                <option>Pulmonologist</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Referral</label>
              <textarea rows={4} placeholder="Describe why the patient needs to see a specialist..." className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="glass-card px-6 py-2.5 text-slate-200 rounded-xl text-sm font-medium transition-all hover:border-teal-400/30 flex items-center gap-2">
              <Send size={16} />
              Generate Referral
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
