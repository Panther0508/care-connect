import { motion } from "framer-motion";
import { Users, FileText, Calendar, MessageSquare, UserPlus } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import MagneticButton from "../components/MagneticButton";

const PATIENTS = [
  { id: "1", name: "Amina Ibrahim", age: 34, condition: "Hypertension", lastVisit: "2026-04-15" },
  { id: "2", name: "Chinedu Okafor", age: 58, condition: "Type 2 Diabetes", lastVisit: "2026-04-20" },
  { id: "3", name: "Fatima Aliyu", age: 28, condition: "Pregnancy — 32 wks", lastVisit: "2026-03-10" },
];

const statsContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const statsItem = {
  hidden: { opacity: 0, scale: 0.8, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

const patientListStagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const patientItem = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
};

export default function ClinicianView() {
  return (
    <div className="space-y-6 p-4 pb-24">
      <ScrollReveal>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clinician View</h1>
          <p className="text-slate-400 text-sm">Manage your patient roster</p>
        </div>
      </ScrollReveal>

      {/* Quick stats */}
      <ScrollReveal delay={80}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-20px" }}
          variants={statsContainer}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: Users, value: PATIENTS.length, label: "Patients", color: "text-teal-400" },
            { icon: Calendar, value: 5, label: "This Week", color: "text-amber-400" },
            { icon: FileText, value: 12, label: "Notes", color: "text-emerald-400" },
          ].map((stat, idx) => (
            <motion.div key={idx} variants={statsItem} className="glass-card p-4 text-center">
              <stat.icon className={`mx-auto mb-2 ${stat.color}`} size={20} />
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </ScrollReveal>

      {/* Patient list */}
      <ScrollReveal delay={160}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-20px" }}
          variants={patientListStagger}
          className="space-y-3"
        >
          <motion.h2 variants={patientItem} className="text-lg font-semibold text-white mb-3">
            My Patients
          </motion.h2>
          {PATIENTS.map((patient) => (
            <motion.div
              key={patient.id}
              variants={patientItem}
              whileHover={{ y: -3, scale: 1.01 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold"
                  >
                    {patient.name.charAt(0)}
                  </motion.div>
                  <div>
                    <h3 className="font-medium text-white">{patient.name}</h3>
                    <p className="text-xs text-slate-400">Age {patient.age}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-teal-400 hover:underline text-sm"
                >
                  View
                </motion.button>
              </div>
              <p className="text-sm text-slate-300">{patient.condition}</p>
              <p className="text-xs text-slate-500 mt-1">Last visit: {patient.lastVisit}</p>
            </motion.div>
          ))}
        </motion.div>
      </ScrollReveal>

      {/* Add patient button */}
      <ScrollReveal delay={240}>
        <MagneticButton
          className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 min-h-[56px]"
        >
          <UserPlus size={18} />
          Add New Patient
        </MagneticButton>
      </ScrollReveal>
    </div>
  );
}
