import { motion } from "framer-motion";
import { Users, FileText, Calendar, MessageSquare, UserPlus } from "lucide-react";

const PATIENTS = [
  { id: "1", name: "Amina Ibrahim", age: 34, condition: "Hypertension", lastVisit: "2026-04-15" },
  { id: "2", name: "Chinedu Okafor", age: 58, condition: "Type 2 Diabetes", lastVisit: "2026-04-20" },
  { id: "3", name: "Fatima Aliyu", age: 28, condition: "Pregnancy — 32 wks", lastVisit: "2026-03-10" },
];

export default function ClinicianView() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Clinician View</h1>
        <p className="text-slate-400 text-sm">Manage your patient roster</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <Users className="text-teal-400 mx-auto mb-2" size={20} />
          <p className="text-xl font-bold text-white">{PATIENTS.length}</p>
          <p className="text-xs text-slate-400">Patients</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Calendar className="text-amber-400 mx-auto mb-2" size={20} />
          <p className="text-xl font-bold text-white">5</p>
          <p className="text-xs text-slate-400">This Week</p>
        </div>
        <div className="glass-card p-4 text-center">
          <FileText className="text-emerald-400 mx-auto mb-2" size={20} />
          <p className="text-xl font-bold text-white">12</p>
          <p className="text-xs text-slate-400">Notes</p>
        </div>
      </div>

      {/* Patient list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">My Patients</h2>
        {PATIENTS.map((patient) => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-white">{patient.name}</h3>
                  <p className="text-xs text-slate-400">Age {patient.age}</p>
                </div>
              </div>
              <button className="text-teal-400 hover:underline text-sm">View</button>
            </div>
            <p className="text-sm text-slate-300">{patient.condition}</p>
            <p className="text-xs text-slate-500 mt-1">Last visit: {patient.lastVisit}</p>
          </motion.div>
        ))}
      </div>

      {/* Add patient button */}
      <button className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
        <UserPlus size={18} />
        Add New Patient
      </button>
    </motion.div>
  );
}
