import { motion } from "framer-motion";
import { BookOpen, Play, CheckCircle, Lock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchAndStoreEducationModules,
  getEducationModules,
  getEducationProgress,
  markLessonCompleted,
  calculateModuleProgress,
} from "../services/educationEngine";
import { useStatus } from "../hooks/useStatus";
import LoadingSpinner from "../components/LoadingSpinner";

interface Lesson {
  id: string;
  title: string;
  content: string;
  type: string;
  quiz?: Array<{ question: string; options: string[]; correctAnswer: number }>;
}

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  category: string;
  lessons: Lesson[];
  completed?: boolean;
}

export default function EducationPage() {
  const { user } = useAuth();
  const { showStatus } = useStatus();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<{ [lessonId: string]: boolean }>({});

  useEffect(() => {
    loadModules();
  }, []);

  async function loadModules() {
    try {
      setLoading(true);
      setError(null);
      // Fetch from public JSON and store in IDB
      await fetchAndStoreEducationModules();
      const stored = await getEducationModules();
      if (stored && stored.length > 0) {
        // Transform flat modules array (from IDB) to include lessons from JSON
        const jsonResponse = await fetch("/healthEducation.json");
        const jsonData = await jsonResponse.json();
        const moduleMap = new Map(jsonData.modules.map((m: any) => [m.id, m]));
        const enhanced = (stored as any[]).map((s) => moduleMap.get(s.id) || s);
        setModules(enhanced);
      } else {
        // Fallback to JSON directly if IDB empty
        const jsonResponse = await fetch("/healthEducation.json");
        const jsonData = await jsonResponse.json();
        setModules(jsonData.modules);
      }
    } catch (err) {
      console.error("Failed to load education modules:", err);
      setError("Could not load education content.");
    } finally {
      setLoading(false);
    }
  }

  function openModule(module: Module) {
    setActiveModule(module);
    if (module.lessons?.length > 0) {
      setCurrentLesson(module.lessons[0]);
    }
  }

  async function handleCompleteLesson(lessonId: string) {
    if (!user || !activeModule) return;
    try {
      await markLessonCompleted(user.id, activeModule.id, lessonId);
      setLessonProgress({ ...lessonProgress, [lessonId]: true });
      showStatus("success", "Lesson Completed!", "Great progress!");
      // Advance to next lesson if available
      const lessons = activeModule.lessons;
      const idx = lessons.findIndex((l) => l.id === lessonId);
      if (idx < lessons.length - 1) {
        setCurrentLesson(lessons[idx + 1]);
      } else {
        setCurrentLesson(null);
        showStatus("success", "Module Complete!", "You've finished this module.");
      }
    } catch (err) {
      console.error("Failed to save progress:", err);
      showStatus("error", "Error", "Could not save progress.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={48} />
          <p className="text-slate-400 text-sm">Loading education modules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Education Hub</h1>
          <p className="text-slate-400 text-sm">Learn about your health</p>
        </div>
        <div className="glass-card p-6 text-center">
          <p className="text-rose-300">{error}</p>
          <button onClick={loadModules} className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-white">
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  // Active module view
  if (activeModule && currentLesson) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
        <button
          onClick={() => {
            setActiveModule(null);
            setCurrentLesson(null);
          }}
          className="text-teal-400 hover:text-teal-300 flex items-center gap-2 text-sm mb-2"
        >
          ← Back to modules
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{activeModule.title}</h1>
          <p className="text-slate-400 text-sm">{activeModule.description}</p>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-3">{currentLesson.title}</h2>
          <p className="text-slate-300 leading-relaxed mb-4">{currentLesson.content}</p>

          {/* Quiz placeholder */}
          {currentLesson.quiz && currentLesson.quiz.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-white mb-3">Quick Check</h3>
              {currentLesson.quiz.map((q, qIdx) => (
                <div key={qIdx} className="mb-4">
                  <p className="text-slate-300 mb-2">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 cursor-pointer hover:bg-slate-700/50">
                        <input type="radio" name={`quiz-${qIdx}`} className="accent-teal-500" />
                        <span className="text-sm text-slate-200">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => handleCompleteLesson(currentLesson.id)}
            disabled={lessonProgress[currentLesson.id]}
            className="mt-6 w-full px-4 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
          >
            {lessonProgress[currentLesson.id] ? "Completed ✓" : "Mark as Complete"}
          </button>
        </div>
      </motion.div>
    );
  }

  // Modules grid
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
          <p className="text-xl font-bold text-white">
            {modules.filter((m) => lessonProgress[`${m.id}_completed`] || false).length}/{modules.length}
          </p>
        </div>
        <div className="w-20 h-2 bg-slate-700/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${(modules.filter((m) => lessonProgress[`${m.id}_completed`] || false).length / modules.length) * 100}%`,
            }}
            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
          />
        </div>
      </div>

      {/* Modules grid */}
      <div className="space-y-3">
        {modules.map((module) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card p-4 ${lessonProgress[`${module.id}_completed`] ? "opacity-70" : ""}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center text-2xl flex-shrink-0">
                {module.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-semibold ${lessonProgress[`${module.id}_completed`] ? "text-slate-400 line-through" : "text-white"}`}>
                      {module.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{module.category}</p>
                  </div>
                  {lessonProgress[`${module.id}_completed`] ? (
                    <CheckCircle className="text-emerald-400" size={20} />
                  ) : (
                    <button
                      onClick={() => openModule(module)}
                      className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-500/30 text-teal-300 rounded-lg text-xs font-medium transition-all"
                    >
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
