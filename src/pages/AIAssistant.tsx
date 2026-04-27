// src/pages/AIAssistant.tsx
// On-device Medical AI assistant using Gemma 2B

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

type MessageRole = "user" | "assistant" | "system";

interface Message {
  role: MessageRole;
  content: string;
}

export default function AIAssistant() {
  const { showStatus, dismissStatus } = useStatus();
  const loaderToastRef = useRef<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rxnormReady, setRxnormReady] = useState(false);

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

  // Action: Clinical Summary
  const handleClinicalSummary = async () => {
    if (!modelLoaded) {
      addMessage("system", "AI model is still loading. Please wait...");
      return;
    }

    const healthState = getCurrentHealthState();
    if (
      !healthState.conditions.length &&
      !healthState.medications.length &&
      !healthState.allergies.length
    ) {
      addMessage("system", "No health data available. Please add some records in the Health section first.");
      return;
    }

    setIsProcessing(true);
    addMessage("user", "Generate a clinical summary of my health");

    try {
      const summary = await generateClinicalSummary(healthState);
      addMessage("assistant", summary);
    } catch (err) {
      console.error(err);
      addMessage("assistant", "Sorry, I couldn't generate a summary right now. Please try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Pre-Visit Summary (cardiology)
  const handlePreVisitSummary = async (specialty: string = "cardiology") => {
    if (!modelLoaded) {
      addMessage("system", "AI model is still loading. Please wait...");
      return;
    }

    const healthState = getCurrentHealthState();
    if (
      !healthState.conditions.length &&
      !healthState.medications.length &&
      !healthState.allergies.length
    ) {
      addMessage("system", "No health data available. Please add some records in the Health section first.");
      return;
    }

    setIsProcessing(true);
    addMessage("user", `Generate a pre-visit summary for ${specialty}`);

    try {
      const summary = await generatePreVisitSummary(healthState, specialty);
      addMessage("assistant", summary);
    } catch (err) {
      console.error(err);
      addMessage("assistant", "Sorry, I couldn't generate a pre-visit summary. Please try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Check medication interaction
  const handleCheckInteraction = async () => {
    const healthState = getCurrentHealthState();
    const currentMeds = healthState.medications.map((m) => m.name);

    if (currentMeds.length === 0) {
      addMessage("system", "You have no medications recorded. Add some medications first.");
      return;
    }

    // If we have real RxNorm, use it; else use simple heuristic or AI
    setIsProcessing(true);
    addMessage("user", "Check medication interactions");

    try {
      if (rxnormReady) {
        // For demo, we'll just check the first med against a sample new med
        // In real usage, we'd ask the user for the new medication name
        addMessage("assistant", "RxNorm database is available. However, you need to specify which new medication you want to check. Please type the medication name in the chat.");
      } else {
        // Use simple heuristic as fallback
        const sampleNewMed = "Ibuprofen"; // demo
        const warnings = checkInteractionsSimple(currentMeds, sampleNewMed);
        if (warnings.length > 0) {
          addMessage("assistant", "Potential interactions found:\n- " + warnings.join("\n- "));
        } else {
          addMessage("assistant", "No known interactions based on simple heuristics. Always consult a pharmacist for definitive interaction checks.");
        }
      }
    } catch (err) {
      console.error(err);
      addMessage("assistant", "Error checking interactions. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Free-form question
  const handleAskQuestion = async () => {
    if (!currentInput.trim()) return;

    if (!modelLoaded) {
      addMessage("system", "AI model is still loading. Please wait...");
      return;
    }

    const question = currentInput.trim();
    setCurrentInput("");
    setIsProcessing(true);
    addMessage("user", question);

    try {
      const healthState = getCurrentHealthState();
      const answer = await askMedicalQuestion(healthState, question);
      addMessage("assistant", answer);
    } catch (err) {
      console.error(err);
      addMessage("assistant", "Sorry, I couldn't answer that question right now. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">AI Health Assistant</h1>
        <p className="text-slate-400 text-sm">
          Powered by Gemma 2B, running entirely on your device. Your data never leaves your phone.
        </p>
      </header>

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleClinicalSummary}
          disabled={isProcessing || !modelLoaded}
          className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/30 text-slate-200 rounded-lg text-xs hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Summarise My Health
        </button>
        <button
          onClick={() => handlePreVisitSummary("cardiology")}
          disabled={isProcessing || !modelLoaded}
          className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/30 text-slate-200 rounded-lg text-xs hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cardiology Pre-Visit Summary
        </button>
        <button
          onClick={handleCheckInteraction}
          disabled={isProcessing}
          className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/30 text-slate-200 rounded-lg text-xs hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Check Medication Interaction
        </button>
      </div>

      {/* chat display */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && modelLoaded && (
          <div className="text-center text-slate-500 py-10">
            <p>Ask a medical question or use the quick actions above.</p>
          </div>
        )}

        {!modelLoaded && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <VitaAvatar state="loading" size={100} />
            <p className="mt-4 text-amber-400">Loading AI model, please wait…</p>
            <p className="text-xs text-slate-500 mt-2">First load may take a few minutes</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-teal-500/20 text-teal-100 border border-teal-500/30"
                    : msg.role === "system"
                    ? "bg-amber-500/10 text-amber-200 border border-amber-500/20 text-sm"
                    : "bg-slate-800/60 text-slate-200 border border-slate-700/30"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Thinking...
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="mt-4 pt-4 border-t border-slate-700/30">
        <div className="flex items-end gap-2">
          <textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAskQuestion();
              }
            }}
            placeholder="Ask a medical question (e.g., 'Is it safe to take ibuprofen with my current meds?')"
            disabled={isProcessing}
            rows={2}
            className="flex-1 bg-slate-800/50 border border-slate-700/30 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none resize-none disabled:opacity-50"
          />
          <button
            onClick={handleAskQuestion}
            disabled={isProcessing || !currentInput.trim()}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Note: This AI provides general information only. Always consult a healthcare professional for medical advice.
        </p>
      </div>
    </div>
  );
}
