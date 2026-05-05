import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ChevronRight, Play, Volume2 } from "lucide-react";
import { speakText, isSpeaking, cancelSpeech } from "../services/ttsService";

interface Protocol {
  id: string;
  condition: string;
  icon: string;
  steps: string[];
  ageGroup: "child" | "adult" | "pregnant";
  severity: "low" | "medium" | "high";
}

const PROTOCOLS: Protocol[] = [
  {
    id: "malaria",
    condition: "Malaria",
    icon: "🦟",
    ageGroup: "all",
    severity: "high",
    steps: [
      "Confirm fever (temperature > 38°C)",
      "Perform rapid diagnostic test (RDT)",
      "If positive, administer ACT (artemisinin-based combination therapy)",
      "Treat fever with paracetamol",
      "Advise on hydration and rest",
      "Follow up in 48 hours",
    ],
  },
  {
    id: "pneumonia",
    condition: "Pneumonia",
    icon: "🫁",
    ageGroup: "child",
    severity: "high",
    steps: [
      "Check for fast breathing or indrawing chest",
      "Count respiratory rate",
      "If severe: refer immediately to facility",
      "If non-severe: prescribe amoxicillin",
      "Advise on nutrition and follow-up",
    ],
  },
  {
    id: "diarrhea",
    condition: "Diarrhea",
    icon: "💧",
    ageGroup: "all",
    severity: "medium",
    steps: [
      "Assess dehydration signs (skin pinch, sunken eyes)",
      "Give ORS (oral rehydration salts)",
      "Continue feeding, especially for children",
      "If severe dehydration → refer",
      "Zinc supplementation for children",
    ],
  },
  {
    id: "hypertension",
    condition: "Hypertension",
    icon: "❤️",
    ageGroup: "adult",
    severity: "medium",
    steps: [
      "Measure blood pressure twice, 5 min apart",
      "If ≥ 140/90, confirm on second reading",
      "Lifestyle counselling: reduce salt, increase activity",
      "Start antihypertensive per protocol",
      "Schedule follow-up in 1 month",
    ],
  },
  {
    id: "pregnancy-check",
    condition: "Antenatal Check",
    icon: "🤰",
    ageGroup: "pregnant",
    severity: "high",
    steps: [
      "Check blood pressure and urine (protein)",
      "Measure fundal height, listen to fetal heart",
      "Administer intermittent preventive treatment for malaria (IPTp) if applicable",
      "Give iron and folic acid supplements",
      "Screen for complications, refer if needed",
      "Schedule next visit",
    ],
  },
];

export default function ProtocolNavigator() {
  const [search, setSearch] = useState("");
  const [filterAge, setFilterAge] = useState<string>("all");
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  const filtered = PROTOCOLS.filter((p) => {
    const matchesSearch = p.condition.toLowerCase().includes(search.toLowerCase());
    const matchesAge = filterAge === "all" || p.ageGroup === filterAge || p.ageGroup === "all";
    return matchesSearch && matchesAge;
  });

  const handleSpeakStep = (step: string) => {
    if (speaking) {
      cancelSpeech();
      setSpeaking(false);
    } else {
      speakText(step, { language: "en" });
      setSpeaking(true);
    }
  };

  const getSeverityColor = (severity: Protocol["severity"]) => {
    switch (severity) {
      case "high": return "bg-rose-500/20 text-rose-300";
      case "medium": return "bg-amber-500/20 text-amber-300";
      case "low": return "bg-emerald-500/20 text-emerald-300";
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Protocol Navigator</h1>
        <p className="text-slate-400 text-sm">WHO guidelines at your fingertips</p>
      </div>

      {/* Search & filter */}
      <div className="glass-card p-4">
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search condition..."
              className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <select
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              className="glass-input pl-10 pr-8 py-2.5 text-sm appearance-none bg-transparent"
            >
              <option value="all">All ages</option>
              <option value="child">Child</option>
              <option value="adult">Adult</option>
              <option value="pregnant">Pregnant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Protocol list */}
      <div className="space-y-3">
        {filtered.map((protocol) => (
          <motion.button
            key={protocol.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              setSelectedProtocol(protocol);
              setCurrentStep(0);
            }}
            className="w-full glass-card p-4 text-left hover:border-teal-500/30 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center text-2xl">
                {protocol.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{protocol.condition}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(protocol.severity)}`}>
                    {protocol.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {protocol.steps.length} steps • {protocol.ageGroup}
                </p>
              </div>
              <ChevronRight className="text-slate-400" size={20} />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Protocol detail modal */}
      <AnimatePresence>
        {selectedProtocol && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedProtocol(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-w-2xl mx-auto mt-20 glass-card rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-white/5">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center text-3xl">
                    {selectedProtocol.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedProtocol.condition}</h2>
                    <p className="text-slate-400 text-sm">
                      {selectedProtocol.steps.length} steps • {selectedProtocol.ageGroup} • {selectedProtocol.severity}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-medium text-white mb-3">Protocol Steps</h3>
                <div className="space-y-3">
                  {selectedProtocol.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border flex items-start gap-3 ${
                        index === currentStep
                          ? "bg-teal-500/10 border-teal-500/30"
                          : "bg-slate-800/30 border-slate-700/30"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="flex-1 text-slate-200 text-sm">{step}</p>
                      <button
                        onClick={() => handleSpeakStep(step)}
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          speaking ? "bg-rose-500/20 text-rose-300" : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                        }`}
                        title="Read step aloud"
                      >
                        {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 border-t border-white/5 flex justify-between">
                <button
                  onClick={() => setSelectedProtocol(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm text-white transition-colors"
                >
                  Close
                </button>
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={() => setCurrentStep(s => s - 1)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm text-white transition-colors"
                    >
                      Previous
                    </button>
                  )}
                  {currentStep < selectedProtocol.steps.length - 1 && (
                    <button
                      onClick={() => setCurrentStep(s => s + 1)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm text-white transition-colors flex items-center gap-2"
                    >
                      <Play size={14} />
                      Next Step
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
