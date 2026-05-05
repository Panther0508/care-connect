import { motion } from "framer-motion";
import { Calendar, FileText, Users, MessageSquare, TrendingUp, Clock, ChevronRight } from "lucide-react";

const APPOINTMENTS = [
  { id: "1", patient: "Amina Ibrahim", time: "10:00 AM", type: "Follow-up", status: "confirmed" },
  { id: "2", patient: "Chinedu Okafor", time: "2:30 PM", type: "Consultation", status: "pending" },
  { id: "3", patient: "Fatima Aliyu", time: "4:00 PM", type: "Pregnancy Check", status: "confirmed" },
];

const RECENT_NOTES = [
  { id: "1", patient: "Amina Ibrahim", note: "BP improved, continue current regimen.", time: "Yesterday" },
  { id: "2", patient: "Chinedu Okafor", note: "Adjusted insulin dosage. Follow up in 2 weeks.", time: "2 days ago" },
];

export default function ClinicianDashboard() {
  const todayCount = APPOINTMENTS.length;
  const pendingReports = 3;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Clinician Dashboard</h1>
        <p className="text-slate-400 text-sm">Your clinical overview for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <Calendar className="text-teal-400 mb-2" size={20} />
          <p className="text-2xl font-bold text-white">{todayCount}</p>
          <p className="text-xs text-slate-400">Today's Appointments</p>
        </div>
        <div className="glass-card p-4">
          <FileText className="text-amber-400 mb-2" size={20} />
          <p className="text-2xl font-bold text-white">{pendingReports}</p>
          <p className="text-xs text-slate-400">Pending Reports</p>
        </div>
      </div>

      {/* Today's schedule */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Today's Schedule</h2>
          <a href="/clinician-view" className="text-xs text-teal-400 hover:underline">
            View all
          </a>
        </div>
        <div className="space-y-3">
          {APPOINTMENTS.map((apt) => (
            <div key={apt.id} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{apt.patient}</p>
                <p className="text-xs text-slate-400">{apt.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">{apt.time}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${apt.status === "confirmed" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {apt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent notes */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Notes</h2>
        <div className="space-y-3">
          {RECENT_NOTES.map((note) => (
            <div key={note.id} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-white text-sm">{note.patient}</p>
                <span className="text-xs text-slate-500">{note.time}</span>
              </div>
              <p className="text-slate-300 text-sm">{note.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <a href="/referral-generator" className="glass-card p-4 hover:border-teal-500/30 transition-all text-center">
          <FileText className="text-teal-400 mx-auto mb-2" size={24} />
          <p className="text-sm font-medium text-white">New Referral</p>
        </a>
        <a href="/ai" className="glass-card p-4 hover:border-teal-500/30 transition-all text-center">
          <MessageSquare className="text-cyan-400 mx-auto mb-2" size={24} />
          <p className="text-sm font-medium text-white">Ask AI Assistant</p>
        </a>
      </div>
    </motion.div>
  );
}
