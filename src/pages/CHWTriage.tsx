import { motion } from "framer-motion";
import { Users, AlertTriangle, Clock, ChevronRight, Volume2, VolumeX, Stethoscope } from "lucide-react";
import { speakText, isSpeaking, cancelSpeech } from "../services/ttsService";

interface TriageTask {
  id: string;
  patientName: string;
  age: number;
  condition: string;
  urgency: "routine" | "elevated" | "emergency";
  lastVisit: string;
  icon: string; // healthicon filename
}

const MOCK_TASKS: TriageTask[] = [
  {
    id: "1",
    patientName: "Amina Ibrahim",
    age: 34,
    condition: "Hypertension",
    urgency: "elevated",
    lastVisit: "2 days ago",
    icon: "blood-pressure.svg",
  },
  {
    id: "2",
    patientName: "Chinedu Okafor",
    age: 58,
    condition: "Type 2 Diabetes",
    urgency: "routine",
    lastVisit: "1 week ago",
    icon: "diabetes.svg",
  },
  {
    id: "3",
    patientName: "Fatima Aliyu",
    age: 28,
    condition: "Pregnancy — 32 weeks",
    urgency: "emergency",
    lastVisit: "1 month ago",
    icon: "pregnancy.svg",
  },
];

export default function CHWTriage() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleSpeak = (task: TriageTask, e: React.MouseEvent) => {
    e.stopPropagation();
    if (speakingId === task.id) {
      cancelSpeech();
      setSpeakingId(null);
    } else {
      cancelSpeech();
      const text = `Patient ${task.patientName}, age ${task.age}, ${task.condition}. Last visit ${task.lastVisit}. Urgency: ${task.urgency}.`;
      speakText(text, { language: "en" });
      setSpeakingId(task.id);
    }
  };

  const getUrgencyColor = (urgency: TriageTask["urgency"]) => {
    switch (urgency) {
      case "emergency": return "border-rose-500/30 bg-rose-500/10";
      case "elevated": return "border-amber-500/30 bg-amber-500/10";
      case "routine": return "border-emerald-500/30 bg-emerald-500/10";
    }
  };

  const getBadgeColor = (urgency: TriageTask["urgency"]) => {
    switch (urgency) {
      case "emergency": return "bg-rose-500/20 text-rose-300";
      case "elevated": return "bg-amber-500/20 text-amber-300";
      case "routine": return "bg-emerald-500/20 text-emerald-300";
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">CHW Triage</h1>
          <p className="text-slate-400 text-sm">Prioritise home visits visually</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm">
          <Stethoscope size={16} />
          {MOCK_TASKS.length} patients
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Routine</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Elevated</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span>Emergency</span>
        </div>
      </div>

      {/* Task cards */}
      <div className="space-y-3">
        {MOCK_TASKS.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card border-l-4 ${getUrgencyColor(task.urgency)}`}
          >
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Large icon placeholder */}
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🩺</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{task.patientName}</h3>
                      <p className="text-slate-400 text-sm">
                        Age {task.age} • {task.condition}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(task.urgency)}`}>
                      {task.urgency.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs">
                    <Clock size={12} />
                    Last visit: {task.lastVisit}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 px-4 py-2 bg-teal-600/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-300 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                      <Stethoscope size={14} />
                      Visit Protocol
                    </button>
                    <button
                      onClick={(e) => handleSpeak(task, e)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                        speakingId === task.id
                          ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                          : "bg-slate-700/50 border-slate-600/30 text-slate-300 hover:bg-slate-600/50"
                      }`}
                      title={speakingId === task.id ? "Stop reading" : "Read aloud"}
                    >
                      {speakingId === task.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info banner */}
      <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-slate-300">
            <strong>Priority reminder:</strong> Emergency cases (red) require immediate attention within 2 hours. Elevated (amber) within 24 hours. Routine (green) within 7 days.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
