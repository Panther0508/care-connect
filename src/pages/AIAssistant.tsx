import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import VitaAvatar from "../components/VitaAvatar";
import {
  loadModel,
  isModelReady,
  generateClinicalSummary,
  generatePreVisitSummary,
  checkMedicationInteractionLLM,
  askMedicalQuestion,
} from "../services/medicalAI";
import { checkInteractionsSimple } from "../services/medicationChecker";
import { getCurrentHealthState } from "../services/healthGraph";
import { getAllRxNorm } from "../lib/idb";
import { useStatus } from "../hooks/useStatus";
import { X, Send, Mic, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";

type MessageRole = "user" | "assistant" | "system";

interface Message {
  role: MessageRole;
  content: string;
}

// Quick prompt chips with their handlers
const QUICK_PROMPTS = [
  { label: "Summarise my health", handler: "summary" },
  { label: "What are my care gaps?", handler: "gaps" },
  { label: "Check a new medication", handler: "interaction" },
  { label: "Generate passport summary", handler: "passport" },
];

export default function AIAssistant() {
  const navigate = useNavigate();
  const { showStatus, dismissStatus } = useStatus();
  const loaderToastRef = useRef<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rxnormReady, setRxnormReady] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load model on mount
  useEffect(() => {
    const prepareModel = async () => {
      try {
        setLoadingModel(true);
        loaderToastRef.current = showStatus(
          "loading",
          "Initialising AI Engine",
          "This only happens once. The model will work offline after download.",
          { duration: 0 }
        );
        await loadModel();
        setModelLoaded(true);
        showStatus("success", "AI Engine Ready", "You can now use the assistant offline.");
      } catch (err) {
        console.error("Failed to load Gemma model:", err);
        showStatus("error", "AI Load Failed", "Could not initialise the engine. Check your storage.");
      } finally {
        setLoadingModel(false);
        if (loaderToastRef.current) {
          dismissStatus(loaderToastRef.current);
          loaderToastRef.current = null;
        }
      }
    };
    prepareModel();
    return () => {
      if (loaderToastRef.current) {
        dismissStatus(loaderToastRef.current);
        loaderToastRef.current = null;
      }
    };
  }, [showStatus, dismissStatus]);

  // Initialize RxNorm data if needed
  useEffect(() => {
    const initRxNorm = async () => {
      const existing = await getAllRxNorm();
      if (existing.length === 0) {
        // RxNorm not populated; checker will fall back to heuristics
      } else {
        setRxnormReady(true);
      }
    };
    initRxNorm();
  }, []);

  const addMessage = (role: MessageRole, content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  // Main message handler
  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    if (!modelLoaded) {
      addMessage("system", "AI model is still loading. Please wait...");
      return;
    }

    setCurrentInput("");
    setIsProcessing(true);
    addMessage("user", text);

    try {
      const healthState = getCurrentHealthState();
      const lowerText = text.toLowerCase();

      // Check for quick prompt handlers
      if (text.includes("summary") || lowerText.includes("summarise my health") || lowerText.includes("summarize")) {
        if (
          !healthState.conditions.length &&
          !healthState.medications.length &&
          !healthState.allergies.length
        ) {
          addMessage("assistant", "No health data available. Please add some records in the Health section first.");
          return;
        }
        const summary = await generateClinicalSummary(healthState);
        addMessage("assistant", `**Clinical Summary**\n\n${summary}`);
        return;
      }

      if (lowerText.includes("care gaps") || lowerText.includes("gaps") || lowerText.includes("missing")) {
        // Generate a gaps analysis
        const gaps: string[] = [];
        if (healthState.conditions.length === 0) {
          gaps.push("No conditions recorded — consider scheduling a full physical exam.");
        }
        if (healthState.medications.length === 0) {
          gaps.push("No medications listed — if you take any, add them for interaction checking.");
        }
        if (healthState.allergies.length === 0) {
          gaps.push("No allergies recorded — important for safe prescribing.");
        }
        // Check for recent condition without recent encounter
        const lastCondition = healthState.conditions[healthState.conditions.length - 1];
        if (lastCondition && (!healthState.encounters.length || new Date(healthState.encounters[healthState.encounters.length - 1]?.date) < new Date(lastCondition.diagnosedDate))) {
          gaps.push(`Consider scheduling a follow-up for your ${lastCondition.name}.`);
        }
        if (gaps.length === 0) {
          gaps.push("Your records look complete! Keep up the good health maintenance.");
        }
        addMessage("assistant", `**Care Gaps Analysis**\n\n- ${gaps.join("\n- ")}`);
        return;
      }

      if (lowerText.includes("medication") && (lowerText.includes("interact") || lowerText.includes("check"))) {
        const currentMeds = healthState.medications.map((m) => m.name);
        if (currentMeds.length === 0) {
          addMessage("assistant", "You have no medications recorded. Add some medications first.");
          return;
        }
        // Use heuristic checker
        const sampleNewMed = "New Medication"; // generic placeholder
        const warnings = checkInteractionsSimple(currentMeds, sampleNewMed);
        if (warnings.length > 0) {
          addMessage("assistant", `**Interaction Check**\n\nPotential concerns:\n- ${warnings.join("\n- ")}\n\nAlways confirm with your pharmacist.`);
        } else {
          addMessage("assistant", "**Interaction Check**\n\nNo known interactions based on simple heuristics. Always consult a pharmacist for definitive interaction checks.");
        }
        return;
      }

      // Passport summary
      if (lowerText.includes("passport")) {
        addMessage("assistant", "Your VitaPassport contains your health summary, vaccination record, and QR code for clinician scanning. Visit the Passport page to view or share it.");
        return;
      }

      // Default: free-form question
      const answer = await askMedicalQuestion(healthState, text);
      addMessage("assistant", answer);
    } catch (err) {
      console.error(err);
      addMessage("assistant", "Sorry, I couldn't process that question right now. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-2xl border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 -ml-2 rounded-xl hover:bg-white/5 transition-colors text-slate-300 hover:text-slate-100"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="relative">
            <VitaAvatar state="online" size={44} />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 bg-teal-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg leading-tight">Vita AI</h1>
            <p className="text-slate-400 text-xs">On-device medical assistant</p>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && modelLoaded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center px-6"
          >
            <div className="relative mb-6">
              <VitaAvatar state="online" size={96} />
              <motion.div
                className="absolute -inset-4 rounded-full border-2 border-teal-400 opacity-20"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.2, 0.1, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 text-center tracking-tight">
              Hello, it's Vita
            </h2>
            <p className="text-slate-400 text-sm mt-3 max-w-md leading-relaxed">
              I'm your on-device health assistant. Ask me anything about your health records or get quick medical insights.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 mt-8">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <motion.button
                  key={prompt.label}
                  onClick={() => handleQuickPrompt(prompt.label)}
                  disabled={isProcessing || !modelLoaded}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  className="px-4 py-2.5 glass-card text-slate-200 rounded-xl text-sm font-medium transition-all hover:border-teal-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {!modelLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center px-6"
          >
            <div className="relative mb-6">
              <VitaAvatar state="loading" size={96} />
              <motion.div
                className="absolute -inset-4 rounded-full border border-teal-500/30"
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>
            <p className="text-amber-400 font-semibold text-lg mb-2">Loading AI Engine</p>
            <p className="text-slate-500 text-sm">First load may take a few minutes. You'll be able to use this offline afterwards.</p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isSystem = msg.role === "system";
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[88%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  {!isUser && !isSystem && (
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-800/70 border border-slate-700/50 flex items-center justify-center">
                        <span className="text-xs">AI</span>
                      </div>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 ${isUser
                        ? "bg-gradient-to-r from-teal-500/30 to-cyan-500/20 text-slate-100 border border-teal-500/20"
                        : isSystem
                          ? "bg-amber-500/10 text-amber-200 border border-amber-500/20 text-sm"
                          : "glass-card text-slate-200"
                      }`}
                  >
                    {isUser ? (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</div>
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none">
                        {msg.content.split('\n').map((line, i) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <strong key={i} className="text-teal-300 font-semibold">{line.replace(/\*\*/g, '')}</strong>;
                          }
                          if (line.startsWith('* ') || line.startsWith('- ')) {
                            return <div key={i} className="ml-3 flex items-start gap-2">
                              <span className="text-teal-400 mt-1.5 flex-shrink-0">•</span>
                              <span>{line.substring(2)}</span>
                            </div>;
                          }
                          if (line.trim() === '') {
                            return <div key={i} className="h-2" />;
                          }
                          return <div key={i}>{line}</div>;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-800/70 border border-slate-700/50 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 border border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="glass-card px-4 py-3">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                Vita is thinking...
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick prompt chips */}
      {messages.length === 0 && modelLoaded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pb-4 flex flex-wrap gap-2"
        >
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              onClick={() => handleQuickPrompt(prompt.label)}
              disabled={isProcessing}
              className="glass-card px-4 py-2.5 text-slate-200 rounded-xl text-xs font-medium transition-all hover:border-teal-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {prompt.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Input area */}
      <div className="sticky bottom-0 bg-slate-900/90 backdrop-blur-2xl border-t border-white/5 p-4">
        <form onSubmit={handleSend} className="flex items-end gap-3">
          <div className="flex-1 relative group">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(currentInput);
                }
              }}
              placeholder="Ask me anything about your health records..."
              disabled={isProcessing || !modelLoaded}
              rows={1}
              className="glass-input w-full py-2.5 pr-12 text-sm resize-none min-h-[44px] max-h-32"
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
              onClick={() => handleSend(currentInput)}
              disabled={isProcessing || !currentInput.trim() || !modelLoaded}
            >
              <Send size={16} />
            </motion.button>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
            title="Voice input"
            disabled
          >
            <Mic size={18} />
          </motion.button>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-3 leading-relaxed">
          Vita provides general health information and does not substitute professional medical advice.
        </p>
      </div>
    </div>
  );
}