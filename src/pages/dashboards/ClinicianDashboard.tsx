import { motion } from "framer-motion";
import { Calendar, FileText, Users, MessageSquare, TrendingUp, Clock, ChevronRight, PlusCircle, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import GlassCard from "../../components/GlassCard";

const APPOINTMENTS = [
  { id: "1", patient: "Amina Ibrahim", time: "10:00 AM", type: "Follow-up", status: "confirmed" },
  { id: "2", patient: "Chinedu Okafor", time: "2:30 PM", type: "Consultation", status: "pending" },
  { id: "3", patient: "Fatima Aliyu", time: "4:00 PM", type: "Pregnancy Check", status: "confirmed" },
];

const RECENT_NOTES = [
  { id: "1", patient: "Amina Ibrahim", note: "BP improved, continue current regimen.", time: "Yesterday" },
  { id: "2", patient: "Chinedu Okafor", note: "Adjusted insulin dosage. Follow up in 2 weeks.", time: "2 days ago" },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

export default function ClinicianDashboard() {
  const todayCount = APPOINTMENTS.length;
  const pendingReports = 3;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="space-y-8 p-4 pb-24 max-w-4xl mx-auto"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Clinician Suite</h1>
          <p className="text-slate-400 font-medium">Daily practice overview.</p>
        </div>
        <button className="p-2 bg-teal-500/10 text-teal-400 rounded-full hover:bg-teal-500/20 transition-all">
          <PlusCircle size={28} />
        </button>
      </header>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Today's Appts", value: todayCount, icon: Calendar, color: "text-teal-400", bg: "bg-teal-500/10" },
          { label: "Reports Due", value: pendingReports, icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Active Cases", value: 124, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "Avg. Vitals", value: "98%", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((stat, i) => (
          <motion.div key={i} variants={staggerItem}>
            <GlassCard className="p-4 group" depth="tight">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{stat.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6" depth="loose">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="text-teal-400" size={20} />
              Today's Schedule
            </h2>
            <Link to="/clinician-view" className="text-xs font-black uppercase tracking-widest text-teal-400 hover:text-teal-300 transition-colors">
              Full View
            </Link>
          </div>
          <div className="space-y-4">
            {APPOINTMENTS.map((apt) => (
              <div key={apt.id} className="p-3 rounded-xl bg-slate-800/30 border border-white/5 flex items-center justify-between group hover:bg-slate-800/50 transition-all cursor-pointer">
                <div>
                  <p className="font-bold text-white group-hover:text-teal-400 transition-colors">{apt.patient}</p>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-tighter">{apt.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{apt.time}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${apt.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6" depth="loose">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="text-indigo-400" size={20} />
            Recent Clinical Notes
          </h2>
          <div className="space-y-4">
            {RECENT_NOTES.map((note) => (
              <div key={note.id} className="p-4 rounded-xl bg-slate-800/30 border border-white/5 group hover:bg-slate-800/50 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white text-sm group-hover:text-teal-400 transition-colors">{note.patient}</p>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{note.time}</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed italic">"{note.note}"</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom Quick Links */}
      <section className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <Link to="/referral-generator">
          <GlassCard className="p-5 flex items-center gap-4 group border-l-4 border-l-teal-500" depth="loose">
            <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-white font-bold">New Referral</p>
              <p className="text-xs text-slate-400">Generate clinical documents</p>
            </div>
          </GlassCard>
        </Link>
        <Link to="/ai">
          <GlassCard className="p-5 flex items-center gap-4 group border-l-4 border-l-cyan-500" depth="loose">
            <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <div>
              <p className="text-white font-bold">Consult AI</p>
              <p className="text-xs text-slate-400">Medical reasoning support</p>
            </div>
          </GlassCard>
        </Link>
      </section>
    </motion.div>
  );
}
