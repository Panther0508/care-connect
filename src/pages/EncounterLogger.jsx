// src/pages/EncounterLogger.jsx
// Log community health encounters
import { motion } from 'framer-motion';
import { ClipboardCheck, MapPin, Clock, User } from 'lucide-react';

export default function EncounterLogger() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-4rem)] p-6"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <ClipboardCheck size={28} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Encounter Logger</h1>
            <p className="text-slate-400 text-sm">Record community health visit details</p>
          </div>
        </div>

        <div className="glass-card p-8">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Patient ID</label>
                <input type="text" placeholder="Patient identifier" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Visit Date</label>
                <input type="date" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 text-slate-500" size={16} />
                  <input type="text" placeholder="Village/Area" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Visit Type</label>
                <select className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                  <option>Home Visit</option>
                  <option>Clinic</option>
                  <option>Outreach</option>
                  <option>Follow-up</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Chief Complaint</label>
              <textarea rows={3} placeholder="What brought the patient in?" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Assessment & Plan</label>
              <textarea rows={4} placeholder="Findings, diagnosis, treatment given..." className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="glass-card px-6 py-2.5 text-slate-200 rounded-xl text-sm font-medium transition-all hover:border-teal-400/30 flex items-center gap-2">
                <ClipboardCheck size={16} />
                Save Encounter
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
