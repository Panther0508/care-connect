import { motion } from "framer-motion";
import { BookOpen, Play, CheckCircle, Lock } from "lucide-react";
import { getSetting } from "../lib/idb";

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  category: string;
  completed: boolean;
}

const MODULES: Module[] = [
  { id: "1", title: "Understanding Diabetes", description: "Learn glucose management and lifestyle tips", duration: "15 min", icon: "🩺", category: "Chronic Care", completed: false },
  { id: "2", title: "Medication Adherence", description: "Why taking meds on time matters", duration: "10 min", icon: "💊", category: "Medications", completed: true },
  { id: "3", title: "Nutrition Basics", description: "Building a balanced plate", duration: "12 min", icon: "🥗", category: "Nutrition", completed: false },
  { id: "4", title: "Mental Wellness", description: "Coping with stress and anxiety", duration: "20 min", icon: "🧘", category: "Mental Health", completed: false },
  { id: "5", title: "First Aid Essentials", description: "Common emergencies and response", duration: "18 min", icon: "🚑", category: "Safety", completed: true },
];

export default function EducationPage() {
  const completedCount = MODULES.filter(m => m.completed).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Education Hub</h1>
        <p className="text-slate-400 text-sm">Learn about your health</p>
      </div>

      {/* Progress summary */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Modules Completed</p>
          <p className="text-xl font-bold text-white">{completedCount}/{MODULES.length}</p>
        </div>
        <div className="w-20 h-2 bg-slate-700/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / MODULES.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
          />
        </div>
      </div>

      {/* Modules grid */}
      <div className="space-y-3">
        {MODULES.map((module) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card p-4 ${module.completed ? "opacity-70" : ""}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center text-2xl flex-shrink-0">
                {module.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-semibold ${module.completed ? "text-slate-400 line-through" : "text-white"}`}>
                      {module.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{module.category}</p>
                  </div>
                  {module.completed ? (
                    <CheckCircle className="text-emerald-400" size={20} />
                  ) : (
                    <button className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-500/30 text-teal-300 rounded-lg text-xs font-medium transition-all">
                      Start
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-300 mt-2 line-clamp-2">{module.description}</p>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <Play size={12} />
                  {module.duration}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
