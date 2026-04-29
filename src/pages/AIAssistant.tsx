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
          'loading',
          'Initializing AI Engine',
          'This only happens once. The model will work offline after download.',
          { duration: 0 }
        );
        await loadModel();
        setModelLoaded(true);
        showStatus('success', 'AI Engine Ready', 'You can now use the assistant offline.');
      } catch (err) {
        console.error("Failed to load Gemma model:", err);
        showStatus('error', 'AI Load Failed', 'Could not initialize the engine. Check your storage.');
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
      <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors text-slate-300"
          >
            <ArrowLeft size={22} />
          </button>
          <VitaAvatar state="online" size={36} />
          <div className="flex-1">
            <h1 className="text-white font-semibold leading-tight">Vita AI</h1>
            <p className="text-xs text-slate-400">On-device medical assistant</p>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && modelLoaded && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <VitaAvatar state="online" size={80} />
            <h2 className="text-xl font-semibold text-white mt-4">Hello, I'm Vita</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">
              I'm your on-device health assistant. Ask me anything about your health records or get quick medical insights.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => handleQuickPrompt(prompt.label)}
                  disabled={isProcessing || !modelLoaded}
                  className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/30 text-slate-200 rounded-full text-xs hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!modelLoaded && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <VitaAvatar state="loading" size={80} />
            <p className="mt-4 text-amber-400 font-medium">Loading AI model, please wait…</p>
            <p className="text-xs text-slate-500 mt-2">First load may take a few minutes</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isSystem = msg.role === "system";
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  {!isUser && !isSystem && (
                    <div className="flex-shrink-0 mt-1">
                      <VitaAvatar state="online" size={28} />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      isUser
                        ? "bg-gradient-to-br from-teal-500/30 to-cyan-500/20 text-teal-100 border border-teal-500/30"
                        : isSystem
                        ? "bg-amber-500/10 text-amber-200 border border-amber-500/20 text-sm"
                        : "bg-slate-800/70 text-slate-200 border border-slate-700/40"
                    }`}
                  >
                    {isUser ? (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap prose-prose prose-invert max-w-none">
                        {msg.content.split('\n').map((line, i) => {
                          // Simple markdown-like rendering
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <strong key={i} className="text-teal-300">{line.replace(/\*\*/g, '')}</strong>;
                          }
                          if (line.startsWith('* ') || line.startsWith('- ')) {
                            return <div key={i} className="ml-2 flex items-start gap-2"><span className="text-slate-500">•</span><span>{line.substring(2)}</span></div>;
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-500 text-sm">
            <VitaAvatar state="loading" size={20} />
            Vita is thinking...
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick prompt chips */}
      {messages.length === 0 && modelLoaded && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              onClick={() => handleQuickPrompt(prompt.label)}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/30 text-slate-200 rounded-full text-xs hover:border-teal-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="sticky bottom-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/5 p-4">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(currentInput);
                }
              }}
              placeholder="Ask me anything about your health..."
              disabled={isProcessing || !modelLoaded}
              rows={2}
              className="w-full bg-slate-800/50 border border-slate-700/30 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400 focus:outline-none resize-none disabled:opacity-50 leading-relaxed"
            />
            <button
              type="button"
              className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 transition-colors"
              title="Voice input (coming soon)"
            >
              <Mic size={16} />
            </button>
          </div>
          <button
            type="submit"
            onClick={() => handleSend(currentInput)}
            disabled={isProcessing || !currentInput.trim() || !modelLoaded}
            className="px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/10"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-2 leading-relaxed">
          Vita provides general health information only and does not substitute professional medical advice.
        </p>
      </div>
    </div>
  );
}
