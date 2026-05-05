import { motion } from "framer-motion";
import { Play, CheckCircle, BookOpen, Clock } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
}

const MODULE: Module = {
  id: "1",
  title: "Understanding Diabetes",
  description: "Learn how to manage blood sugar levels through diet, exercise, and medication.",
  duration: "15 minutes",
  category: "Chronic Care",
};

export default function EducationModule() {
  // In production, fetch module by ID from route params
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
    >
      <div className="p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{MODULE.category}</p>
            <h1 className="text-2xl font-bold text-white">{MODULE.title}</h1>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-teal-500/20 text-teal-300 text-sm font-medium flex items-center gap-1">
            <Clock size={14} />
            {MODULE.duration}
          </span>
        </div>

        {/* Content placeholder — in real app would have rich content, videos, quizzes */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">About this module</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">{MODULE.description}</p>

          <h3 className="font-medium text-white mb-2">What you'll learn:</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
              <span>What blood sugar targets mean</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
              <span>How food affects glucose levels</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
              <span>When to call your healthcare provider</span>
            </li>
          </ul>
        </div>

        <button className="w-full px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
          <Play size={18} />
          Start Module
        </button>

        {/* Progress tracking */}
        <div className="mt-6 glass-card p-4 border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="text-amber-400" size={16} />
            <span className="text-sm font-medium text-white">Progress</span>
          </div>
          <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "0%" }}
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">Not started — complete the module to earn points</p>
        </div>
      </div>
    </motion.div>
  );
}
