// src/pages/EmergencyID.jsx
// Emergency medical ID card
import { motion } from 'framer-motion';
import { AlertCircle, Phone, MapPin, Heart, Shield } from 'lucide-react';

export default function EmergencyID() {
  const emergencyInfo = {
    name: 'John Doe',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    conditions: ['Type 2 Diabetes', 'Hypertension'],
    emergencyContact: '+1-555-EMERG',
    address: '123 Main St, City'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-4rem)] p-6"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Emergency ID</h1>
            <p className="text-slate-400 text-sm">Critical medical information for first responders</p>
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-slate-700/50 border-2 border-red-500/30 mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-xl font-bold text-white">{emergencyInfo.name}</h2>
            <p className="text-slate-400">Blood Type: <span className="text-red-300 font-semibold">{emergencyInfo.bloodType}</span></p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <Shield className="text-amber-400 mt-1" size={18} />
              <div>
                <h3 className="text-sm font-medium text-slate-200">Allergies</h3>
                <p className="text-sm text-slate-400">{emergencyInfo.allergies.join(', ')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <Heart className="text-rose-400 mt-1" size={18} />
              <div>
                <h3 className="text-sm font-medium text-slate-200">Medical Conditions</h3>
                <p className="text-sm text-slate-400">{emergencyInfo.conditions.join(', ')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <Phone className="text-green-400 mt-1" size={18} />
              <div>
                <h3 className="text-sm font-medium text-slate-200">Emergency Contact</h3>
                <p className="text-sm text-slate-400 font-mono">{emergencyInfo.emergencyContact}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <MapPin className="text-blue-400 mt-1" size={18} />
              <div>
                <h3 className="text-sm font-medium text-slate-200">Address</h3>
                <p className="text-sm text-slate-400">{emergencyInfo.address}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-center">
            <p className="text-sm text-red-200">This information is intended for emergency medical personnel.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
