import { motion } from "framer-motion";
import { ClipboardList, CheckCircle, Clock, AlertTriangle, Calendar } from "lucide-react";

interface CarePlan {
  id: string;
  title: string;
  description: string;
  tasks: { id: string; title: string; due: string; completed: boolean }[];
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "pending";
}

const MOCK_PLANS: CarePlan[] = [
  {
    id: "1",
    title: "Diabetes Management Plan",
    description: "Weekly goals for blood sugar control and diet",
    startDate: "2026-01-01",
    endDate: "2026-06-30",
    status: "active",
    tasks: [
      { id: "t1", title: "Check fasting blood sugar daily", due: "Daily", completed: true },
      { id: "t2", title: "Walk 30 minutes, 5 days/week", due: "Weekly", completed: false },
      { id: "t3", title: "Attend diabetes education session", due: "2026-02-15", completed: true },
      { id: "t4", title: "Lab: HbA1c test", due: "2026-03-01", completed: false },
    ],
  },
  {
    id: "2",
    title: "Hypertension Follow-up",
    description: "Monitor BP and medication adherence",
    startDate: "2025-11-01",
    endDate: "2026-04-30",
    status: "active",
    tasks: [
      { id: "t5", title: "BP check morning and evening", due: "Daily", completed: false },
      { id: "t6", title: "Medication refill", due: "2026-05-15", completed: false },
    ],
  },
];

export default function CarePlans() {
  const active = MOCK_PLANS.filter((p) => p.status === "active");
  const completed = MOCK_PLANS.filter((p) => p.status === "completed");

  const completedTasks = MOCK_PLANS.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
  const totalTasks = MOCK_PLANS.reduce((sum, p) => sum + p.tasks.length, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Care Plans</h1>
        <p className="text-slate-400 text-sm">Personalised care pathways</p>
      </div>

      {/* Progress overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 text-center">
          <ClipboardList className="text-teal-400 mx-auto mb-2" size={24} />
          <p className="text-2xl font-bold text-white">{MOCK_PLANS.length}</p>
          <p className="text-slate-400 text-xs">Active Plans</p>
        </div>
        <div className="glass-card p-4 text-center">
          <CheckCircle className="text-emerald-400 mx-auto mb-2" size={24} />
          <p className="text-2xl font-bold text-white">{completedTasks}/{totalTasks}</p>
          <p className="text-slate-400 text-xs">Tasks Completed</p>
        </div>
      </div>

      {/* Active plans */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Your Care Plans</h2>
        {active.map((plan) => (
          <div key={plan.id} className="glass-card p-5 border-l-4 border-teal-500/40">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{plan.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
              </div>
              <span className="px-2 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-medium">
                Active
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(plan.tasks.filter(t => t.completed).length / plan.tasks.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-300">Tasks</h4>
              {plan.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg ${
                    task.completed ? "bg-emerald-500/10" : "bg-slate-800/30"
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle className="text-emerald-400 flex-shrink-0" size={16} />
                  ) : (
                    <Clock className="text-amber-400 flex-shrink-0" size={16} />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm ${task.completed ? "text-slate-400 line-through" : "text-slate-200"}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500">{task.due}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Completed plans */}
      {completed.length > 0 && (
        <div className="space-y-3 opacity-70">
          <h2 className="text-lg font-semibold text-slate-400">Completed</h2>
          {completed.map((plan) => (
            <div key={plan.id} className="glass-card p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-emerald-400" size={18} />
                <h3 className="font-medium text-slate-300">{plan.title}</h3>
                <span className="text-xs text-slate-500 ml-auto">
                  {new Date(plan.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
