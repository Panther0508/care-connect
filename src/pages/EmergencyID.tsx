import { motion } from "framer-motion";
import { Shield, AlertTriangle, Heart, Droplets, Baby } from "lucide-react";

export default function EmergencyID() {
  const user = {
    name: "Patient Name",
    bloodType: "O+",
    allergies: ["Penicillin", "Peanuts"],
    conditions: ["Hypertension", "Type 2 Diabetes"],
    emergencyContact: {
      name: "Jane Doe",
      phone: "+234 800 000 0000",
      relationship: "Spouse",
    },
  };

  const qrData = btoa(JSON.stringify(user));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
    >
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold text-white mb-2">Emergency ID</h1>
        <p className="text-slate-400 text-sm mb-6">Critical info for first responders</p>

        <div className="glass-card p-6 text-center mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Scan for Emergency Info</h2>
          <div className="bg-white p-4 rounded-xl inline-block mb-3">
            {/* QR code placeholder — would use qrcode library here */}
            <div className="w-40 h-40 bg-slate-900 flex items-center justify-center text-slate-600">
              <span className="text-xs">[QR CODE]</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Emergency personnel can scan to access your medical summary, allergies, and emergency contact.
          </p>
        </div>

        {/* Summary card */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Personal Info</h3>
              <Shield className="text-teal-400" size={18} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Name</p>
                <p className="text-slate-200">{user.name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Blood Type</p>
                <p className="text-slate-200">{user.bloodType}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 border-rose-500/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-rose-400" size={18} />
              <h3 className="font-semibold text-white">Allergies</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.allergies.map((allergy) => (
                <span key={allergy} className="px-3 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-sm border border-rose-500/20">
                  {allergy}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="text-amber-400" size={18} />
              <h3 className="font-semibold text-white">Conditions</h3>
            </div>
            <ul className="space-y-1">
              {user.conditions.map((cond) => (
                <li key={cond} className="text-slate-300 text-sm flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400" />
                  {cond}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-4 border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="text-emerald-400" size={18} />
              <h3 className="font-semibold text-white">Emergency Contact</h3>
            </div>
            <div className="text-sm text-slate-300">
              <p className="font-medium">{user.emergencyContact.name}</p>
              <p className="text-slate-400">{user.emergencyContact.relationship}</p>
              <a href={`tel:${user.emergencyContact.phone}`} className="text-teal-400 hover:underline">
                {user.emergencyContact.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
