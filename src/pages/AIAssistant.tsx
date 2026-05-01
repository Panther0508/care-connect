import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import VitaAvatar from "../components/VitaAvatar";
import CrisisPopup from "../components/CrisisPopup";
import {
  loadModel,
  isModelReady,
  generateClinicalSummary,
  generatePreVisitSummary,
  checkMedicationInteractionLLM,
  askMedicalQuestion,
  checkMedicationInteraction
} from "../services/medicalAI";
import { checkInteractionsSimple } from "../services/medicationChecker";
import { getCurrentHealthState } from "../services/healthGraph";
import { getAllRxNorm, getAllVectors, retrieveContext } from "../lib/idb";
import { useStatus } from "../hooks/useStatus";
import { getPersona, buildSystemPrompt, generateGreeting } from "../services/personaEngine";
import { scanMessage, scanAIResponse } from "../services/crisisDetector";
import { showCrisisPopup, dismissCrisisPopup, registerCrisisHandler } from "../services/crisisManager";
import { X, Send, Mic, ArrowLeft, AlertCircle, CheckCircle, FileText, Image, Calendar, Pill, Globe, Volume2, VolumeX, Camera } from "lucide-react";
import { getUserProfile } from "../lib/idb";
import { useRole } from "../hooks/auth/useRole";

// Phase 2 services
import { translateText } from "../services/translationService";
import { transcribeFromMic, getWhisperStatus } from "../services/speechService";
import { speakText, isSpeaking, cancelSpeech, getTTSStatus } from "../services/ttsService";
import { scheduleReminder, getAllReminders, initializeReminders } from "../services/medicationReminder";
import { scheduleAppointment, getUpcomingAppointments } from "../services/appointmentService";
import { analyzeSkinLesion, getMedicalDisclaimer } from "../services/imageClassifier";
import { buildAugmentedPrompt, isDatasetQuery, loadEmbeddingModel } from "../services/ragEngine";
import { retrieveContext as retrieveRagContext } from "../services/advancedRAG";
import { generateStructured } from "../services/structuredOutput";
import { getQuotaRemaining, getLastRouteResult } from "../services/hybridAIRouter";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yoruba" },
  { code: "ig", name: "Igbo" },
  { code: "sw", name: "Swahili" }
];

type MessageRole = "user" | "assistant" | "system";

interface Message {
  role: MessageRole;
  content: string;
}

const QUICK_PROMPTS = [
  { label: "Summarise my health", handler: "summary" },
  { label: "What are my care gaps?", handler: "gaps" },
  { label: "Check a new medication", handler: "interaction" },
  { label: "Generate passport summary", handler: "passport" },
];

export default function AIAssistant() {
  const navigate = useNavigate();
  const { showStatus, dismissStatus } = useStatus();
  const { role: userRole } = useRole();
  const loaderToastRef = useRef<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rxnormReady, setRxnormReady] = useState(false);
  const [persona, setPersona] = useState<any>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("auto");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showSpeech, setShowSpeech] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTTS, setShowTTS] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [reminderForm, setReminderForm] = useState({ medicationName: "", time: "09:00", days: [0, 1, 2, 3, 4, 5, 6] });
  const [appointmentForm, setAppointmentForm] = useState({ specialistType: "general", date: "", time: "10:00", purpose: "" });
  const fileInputRef = useRef<any>(null);
  const [crisisVisible, setCrisisVisible] = useState(false);
  const [crisisState, setCrisisState] = useState<{ riskLevel: string; matchedPattern?: string }>({ riskLevel: "LOW" });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeModel, setActiveModel] = useState<'online' | 'cached' | 'offline' | null>(null);
  const [quotaRemaining, setQuotaRemaining] = useState(1500);
  const [modelType, setModelType] = useState<'gemma4-31b' | 'tinyllama-1.1b'>('gemma4-31b');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Update model status periodically
  useEffect(() => {
    const updateModelStatus = () => {
      const quota = getQuotaRemaining();
      setQuotaRemaining(quota.remaining);
      if (quota.used > 0 && quota.used <= 1500) {
        setActiveModel('online');
      }
    };
    updateModelStatus();
    const interval = setInterval(updateModelStatus, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const getLanguageName = (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    registerCrisisHandler((state: any) => {
      setCrisisVisible(state.visible);
      setCrisisState({ riskLevel: state.riskLevel, matchedPattern: state.matchedPattern });
    });
  }, []);

  useEffect(() => {
    const loadProfileAndPersona = async () => {
      try {
        const clerkUser = (window as any).Clerk?.user;
        if (clerkUser) {
          setUserProfile({
            displayName: clerkUser.fullName || "there",
            gender: clerkUser.publicMetadata?.gender || "",
            dateOfBirth: clerkUser.publicMetadata?.dateOfBirth || null,
            biologicalSex: clerkUser.publicMetadata?.biologicalSex || "",
            countryCode: clerkUser.publicMetadata?.countryCode || "ng",
            emergencyContact: clerkUser.publicMetadata?.emergencyContact || null,
          });
          const p = getPersona("patient", clerkUser.publicMetadata);
          setPersona(p);
          const greeting = generateGreeting(p, clerkUser.fullName || "there");
          setMessages([{ role: "assistant", content: greeting }]);
        } else {
          const stored = localStorage.getItem("vitachain_user_profile");
          if (stored) {
            const profile = JSON.parse(stored);
            setUserProfile(profile);
            const p = getPersona("patient", profile);
            setPersona(p);
            const greeting = generateGreeting(p, profile.displayName || "there");
            setMessages([{ role: "assistant", content: greeting }]);
          } else {
            const defaultProfile = { displayName: "there" };
            setUserProfile(defaultProfile);
            const p = getPersona("patient", {});
            setPersona(p);
            const greeting = generateGreeting(p, "there");
            setMessages([{ role: "assistant", content: greeting }]);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        const defaultProfile = { displayName: "there" };
        setUserProfile(defaultProfile);
        const p = getPersona("patient", {});
        setPersona(p);
        const greeting = generateGreeting(p, "there");
        setMessages([{ role: "assistant", content: greeting }]);
      }
    };
    loadProfileAndPersona();
  }, []);

  useEffect(() => {
    const prepareModel = async () => {
      try {
        setLoadingModel(true);
        loaderToastRef.current = showStatus(
          "loading",
          "Initialising AI Engine",
          "Loading TinyLlama - this only happens once. The model will work offline after download.",
          { duration: 0 as any }
        );
        await loadModel((progress: any) => {
          if (progress && progress.status === "downloading") {
            console.log(`Downloading: ${Math.round((progress.loaded || 0) / (progress.total || 1) * 100)}%`);
          }
        });
        setModelLoaded(true);
        showStatus("success", "AI Engine Ready", "You can now use the assistant offline.");
      } catch (err) {
        console.error("Failed to load TinyLlama model:", err);
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
  }, [showStatus, dismissStatus]);

  useEffect(() => {
    const initRxNorm = async () => {
      const existing = await getAllRxNorm();
      if (existing.length > 0) {
        setRxnormReady(true);
      }
    };
    initRxNorm();
    initializeReminders();
  }, []);

  const addMessage = (role: MessageRole, content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const handleTranslation = async (text: string) => {
    if (!text.trim() || targetLanguage === "auto") return text;
    setIsTranslating(true);
    try {
      const translated = await translateText(text, "en", targetLanguage);
      return translated;
    } catch (err) {
      console.error("Translation failed:", err);
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeechInput = async () => {
    if (isRecording) {
      try {
        const result = await transcribeFromMic({ language: "en" });
        setCurrentInput(result.text);
      } catch (err) {
        console.error("Speech recognition failed:", err);
      }
      setIsRecording(false);
    } else {
      setIsRecording(true);
    }
  };

  const handleTextToSpeech = async (text: string) => {
    if (isSpeaking()) {
      cancelSpeech();
      setIsSpeakingNow(false);
    } else {
      await speakText(text, { language: "en" });
      setIsSpeakingNow(true);
    }
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzingImage(true);
    try {
      const result = await analyzeSkinLesion(file);
      addMessage("assistant", `AI Skin Analysis:\n${JSON.stringify(result, null, 2)}\n\n${getMedicalDisclaimer()}`);
    } catch (err) {
      console.error("Image analysis failed:", err);
      addMessage("assistant", "Sorry, image analysis failed. Please try again.");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleQuickReminder = async () => {
    if (!reminderForm.medicationName) return;
    try {
      await scheduleReminder(
        Date.now().toString(),
        reminderForm.medicationName,
        [reminderForm.time],
        reminderForm.days
      );
      setReminderForm({ medicationName: "", time: "09:00", days: [0, 1, 2, 3, 4, 5, 6] });
      addMessage("assistant", "Medication reminder set successfully!");
    } catch (err) {
      console.error("Failed to set reminder:", err);
    }
  };

  const handleQuickAppointment = async () => {
    try {
      const appointment = await scheduleAppointment({
        ...appointmentForm,
        date: appointmentForm.date,
        purpose: appointmentForm.purpose || "Routine checkup",
      });
      addMessage("assistant", `Appointment scheduled for ${appointment.date} at ${appointment.time} with ${appointment.specialistType}.`);
    } catch (err) {
      console.error("Failed to schedule appointment:", err);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    if (!modelLoaded) {
      addMessage("system", "AI model is still loading. Please wait...");
      return;
    }

    setCurrentInput("");
    setIsProcessing(true);

    // CRISIS DETECTION Layer 1 & 2
    const detectionResult = scanMessage(text);
    if (detectionResult.requiresImmediatePopup) {
      setCrisisVisible(true);
      setCrisisState({ riskLevel: detectionResult.riskLevel, matchedPattern: detectionResult.matchedPatterns?.[0] });
    }

    addMessage("user", text);

    try {
      const healthState = getCurrentHealthState();
      const lowerText = text.toLowerCase();
      const systemPrompt = persona ? buildSystemPrompt(persona) : undefined;

      // Check for quick prompt handlers
      if (text.includes("summary") || lowerText.includes("summarise my health") || lowerText.includes("summarize")) {
        if (!healthState.conditions.length && !healthState.medications.length && !healthState.allergies.length) {
          addMessage("assistant", "No health data available. Please add some records in the Health section first.");
          setIsProcessing(false);
          return;
        }
        const summary = await generateClinicalSummary(healthState, systemPrompt);
        const responseDetection = scanAIResponse(summary);
        if (responseDetection.requiresImmediatePopup) {
          setCrisisVisible(true);
          setCrisisState({ riskLevel: responseDetection.riskLevel, matchedPattern: responseDetection.matchedPatterns?.[0] });
        }
        addMessage("assistant", summary);
        // Update model status
        const lastRes = getLastRouteResult();
        if (lastRes?.source === 'online') setActiveModel('online');
        else if (lastRes?.source === 'cached-gemma') setActiveModel('cached');
        else if (lastRes?.source === 'offline') setActiveModel('offline');
        setIsProcessing(false);
        return;
      }

      if (lowerText.includes("care gaps") || lowerText.includes("gaps")) {
        const gaps: string[] = [];
        if (healthState.conditions.length === 0) gaps.push("No conditions recorded — consider scheduling a full physical exam.");
        if (healthState.medications.length === 0) gaps.push("No medications listed — add them for interaction checking.");
        if (healthState.allergies.length === 0) gaps.push("No allergies recorded — important for safe prescribing.");
        const lastCondition = healthState.conditions[healthState.conditions.length - 1];
        if (lastCondition && (!healthState.encounters.length || new Date(healthState.encounters[healthState.encounters.length - 1]?.date) < new Date(lastCondition.diagnosedDate))) {
          gaps.push(`Consider scheduling a follow-up for your ${lastCondition.name}.`);
        }
        if (gaps.length === 0) gaps.push("Your records look complete!");
        addMessage("assistant", `**Care Gaps Analysis**\n\n- ${gaps.join("\n- ")}`);
        setIsProcessing(false);
        return;
      }

      if (lowerText.includes("medication") && (lowerText.includes("interact") || lowerText.includes("check"))) {
        const currentMeds = healthState.medications.map((m: any) => m.name);
        if (currentMeds.length === 0) {
          addMessage("assistant", "You have no medications recorded.");
          setIsProcessing(false);
          return;
        }
        const sampleNewMed = "New Medication";
        const warnings = checkInteractionsSimple(currentMeds, sampleNewMed);
        if (warnings.length > 0) {
          addMessage("assistant", `**Interaction Check**\n\nPotential concerns:\n- ${warnings.join("\n- ")}`);
        } else {
          addMessage("assistant", "**Interaction Check**\n\nNo known interactions based on heuristics.");
        }
        setIsProcessing(false);
        return;
      }

      if (lowerText.includes("passport")) {
        addMessage("assistant", "Your VitaPassport contains your health summary and QR code. Visit the Passport page.");
        setIsProcessing(false);
        return;
      }

       // RAG-Augmented queries
       const datasetMatch = isDatasetQuery(text);
       if (datasetMatch) {
         loadEmbeddingModel().then(async () => {
           const retrieved = await retrieveRagContext(text, datasetMatch.dataset, 5);
           if (retrieved && retrieved.length > 0) {
              const augmentedMessages = buildAugmentedPrompt(text, retrieved.slice(0, 3), systemPrompt || "");
              const answer = await askMedicalQuestion(healthState, text, augmentedMessages[0].content, userRole);
             addMessage("assistant", answer);
             const lastRes = getLastRouteResult();
             if (lastRes?.source === 'online') setActiveModel('online');
             else if (lastRes?.source === 'cached-gemma') setActiveModel('cached');
             else setActiveModel('offline');
            } else {
              const answer = await askMedicalQuestion(healthState, text, systemPrompt, userRole);
              addMessage("assistant", answer);
             const lastRes = getLastRouteResult();
             if (lastRes?.source === 'online') setActiveModel('online');
             else if (lastRes?.source === 'cached-gemma') setActiveModel('cached');
             else setActiveModel('offline');
           }
           setIsProcessing(false);
          }).catch(() => {
            const answer = await askMedicalQuestion(healthState, text, systemPrompt, userRole);
            addMessage("assistant", answer);
           setActiveModel('offline');
           setIsProcessing(false);
         });
         return;
       }

        // Default: free-form question
        const answer = await askMedicalQuestion(healthState, text, systemPrompt, userRole);
       const responseDetection = scanAIResponse(answer);
       if (responseDetection.requiresImmediatePopup) {
         setCrisisVisible(true);
         setCrisisState({ riskLevel: responseDetection.riskLevel, matchedPattern: responseDetection.matchedPatterns?.[0] });
       }
       addMessage("assistant", answer);
       // Update model status from last route result
       const lastRes = getLastRouteResult();
       if (lastRes?.source === 'online') setActiveModel('online');
       else if (lastRes?.source === 'cached-gemma') setActiveModel('cached');
       else if (lastRes?.source === 'offline') setActiveModel('offline');
    } catch (err) {
      console.error(err);
      addMessage("assistant", "Sorry, I couldn't process that. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismissCrisis = () => {
    dismissCrisisPopup();
    setCrisisVisible(false);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-900">
      <CrisisPopup
        visible={crisisVisible}
        riskLevel={crisisState.riskLevel}
        matchedPattern={crisisState.matchedPattern}
        onDismiss={handleDismissCrisis}
        userProfile={userProfile}
      />

       <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-2xl border-b border-white/5 px-4 py-4">
         <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="p-2.5 -ml-2 rounded-xl hover:bg-white/5 transition-colors text-slate-300 hover:text-slate-100">
             <ArrowLeft size={22} />
           </button>
           <div className="relative">
             <VitaAvatar state="online" size={44} />
             <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 bg-teal-500" />
           </div>
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
               <h1 className="text-white font-bold text-lg leading-tight">Vita AI</h1>
               {activeModel && (
                 <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                   activeModel === 'online' ? 'bg-teal-500/20 text-teal-400' :
                   activeModel === 'cached' ? 'bg-amber-500/20 text-amber-400' :
                   'bg-slate-500/20 text-slate-400'
                 }`}>
                   {activeModel === 'online' ? `Gemma-4` : activeModel === 'cached' ? 'Gemma-4 (cached)' : 'TinyLlama'}
                 </span>
               )}
             </div>
             <p className="text-slate-400 text-xs">
               {activeModel === 'online' && `Gemma 4 31B | ${quotaRemaining.toLocaleString()}/1,500 today`}
               {activeModel === 'cached' && `Gemma 4 (cached) | responses from ${new Date().toLocaleDateString()}`}
               {activeModel === 'offline' && 'TinyLlama 1.1B | offline'}
               {!activeModel && 'On-device medical assistant'}
             </p>
           </div>
         </div>
       </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!modelLoaded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="relative mb-6">
              <VitaAvatar state="loading" size={96} />
              <motion.div className="absolute -inset-4 rounded-full border border-teal-500/30" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
            </div>
            <p className="text-amber-400 font-semibold text-lg mb-2">Loading AI Engine</p>
            <p className="text-slate-500 text-sm">Downloading TinyLlama 1.1B — first load only.</p>
          </motion.div>
        )}

        <AnimatePresence mode="pop-layout">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isSystem = msg.role === "system";
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[88%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  {!isUser && !isSystem && (
                    <div className="flex-shrink-0 mt-0.5"><div className="w-8 h-8 rounded-xl bg-slate-800/70 border border-slate-700/50 flex items-center justify-center"><span className="text-xs">AI</span></div></div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 ${isUser ? "bg-gradient-to-r from-teal-500/30 to-cyan-500/20 text-slate-100 border border-teal-500/20" : isSystem ? "bg-amber-500/10 text-amber-200 border border-amber-500/20 text-sm" : "glass-card text-slate-200"}`}>
                    {isUser ? <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</div> : <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none">{msg.content.split("\n").map((line, i) => line.startsWith("**") && line.endsWith("**") ? <strong key={i} className="text-teal-300 font-semibold">{line.replace(/\*\*/g, "")}</strong> : line.startsWith("* ") ? <div key={i} className="ml-3 flex items-start gap-2"><span className="text-teal-400 mt-1.5 flex-shrink-0">•</span><span>{line.substring(2)}</span></div> : line.trim() === "" ? <div key={i} className="h-2" /> : <div key={i}>{line}</div>)}</div>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isProcessing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800/70 border border-slate-700/50 flex items-center justify-center flex-shrink-0"><div className="w-4 h-4 border border-teal-400 border-t-transparent rounded-full animate-spin" /></div>
            <div className="glass-card px-4 py-3"><div className="flex items-center gap-2 text-slate-400 text-sm"><span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />Vita is thinking...</div></div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {messages.length > 0 && modelLoaded && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-4 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button key={prompt.label} onClick={() => handleSend(prompt.label)} disabled={isProcessing} className="glass-card px-4 py-2.5 text-slate-200 rounded-xl text-xs font-medium transition-all hover:border-teal-400/30 disabled:opacity-50 disabled:cursor-not-allowed">{prompt.label}</button>
          ))}
        </motion.div>
      )}

      <div className="sticky bottom-0 bg-slate-900/90 backdrop-blur-2xl border-t border-white/5 p-4">
        <AnimatePresence>
          {showTranslation && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-slate-800/50 border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-teal-400" />
                <span className="text-slate-300">Translate to:</span>
                <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="bg-slate-900 text-slate-100 text-xs rounded px-2 py-1 border border-slate-700">
                  <option value="auto">Auto</option>
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
                {isTranslating && <span className="text-amber-400 text-xs">Translating...</span>}
              </div>
            </motion.div>
          )}
          {showSpeech && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-slate-800/50 border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Mic className={`w-4 h-4 ${isRecording ? "text-red-400 animate-pulse" : "text-teal-400"}`} />
                <button onClick={handleSpeechInput} className={`text-xs px-3 py-1.5 rounded-lg ${isRecording ? "bg-red-500/20 text-red-300" : "bg-teal-500/20 text-teal-300"} transition-all`}>{isRecording ? "Listening" : "Click to speak"}</button>
              </div>
            </motion.div>
          )}
          {showTTS && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-slate-800/50 border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                {isSpeakingNow ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
                <span className="text-slate-300">Text-to-Speech</span>
                <button onClick={() => isSpeakingNow ? cancelSpeech() : setIsSpeakingNow(false)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all">{isSpeakingNow ? "Stop" : "Play last"}</button>
              </div>
            </motion.div>
          )}
          {showImageUpload && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-slate-800/50 border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-teal-400" />
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className={`text-xs px-3 py-1.5 rounded-lg ${isAnalyzingImage ? "bg-slate-500/20" : "bg-teal-500/20 text-teal-300"} transition-all`} disabled={isAnalyzingImage}>{isAnalyzingImage ? "Analyzing..." : "Upload Image"}</button>
              </div>
            </motion.div>
          )}
          {showReminders && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-slate-800/50 border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-teal-400" />
                <input value={reminderForm.medicationName} onChange={(e) => setReminderForm({ ...reminderForm, medicationName: e.target.value })} placeholder="Medication" className="flex-1 bg-slate-900 text-slate-100 text-xs rounded px-2 py-1 border border-slate-700" />
                <input type="time" value={reminderForm.time} onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })} className="bg-slate-900 text-slate-100 text-xs rounded px-2 py-1 border border-slate-700" />
                <button onClick={handleQuickReminder} className="text-xs px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-all">Set</button>
              </div>
            </motion.div>
          )}
          {showAppointments && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-slate-800/50 border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-teal-400" />
                <select value={appointmentForm.specialistType} onChange={(e) => setAppointmentForm({ ...appointmentForm, specialistType: e.target.value })} className="bg-slate-900 text-slate-100 text-xs rounded px-2 py-1 border border-slate-700">
                  <option value="general">General</option>
                  <option value="cardiologist">Cardiologist</option>
                  <option value="endocrinologist">Endocrinologist</option>
                </select>
                <input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} className="bg-slate-900 text-slate-100 text-xs rounded px-2 py-1 border border-slate-700" />
                <input type="time" value={appointmentForm.time} onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })} className="bg-slate-900 text-slate-100 text-xs rounded px-2 py-1 border border-slate-700" />
                <button onClick={handleQuickAppointment} className="text-xs px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-all">Schedule</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(currentInput); }} className="flex items-end gap-3">
          <div className="flex-1 relative group">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(currentInput); } }}
              placeholder="Ask me anything about your health records..."
              disabled={isProcessing || !modelLoaded}
              rows={1}
              className="glass-input w-full py-2.5 pr-12 text-sm resize-none min-h-[44px] max-h-32"
            />
            <button type="button" onClick={() => handleSend(currentInput)} disabled={isProcessing || !currentInput.trim() || !modelLoaded} className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={16} />
            </button>
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => setShowTranslation(!showTranslation)} className={`p-2.5 rounded-xl ${showTranslation ? "bg-teal-500/30 text-teal-300" : "bg-slate-800/70 text-slate-400 hover:text-slate-300"} transition-colors`} title="Translate"><Globe size={18} /></button>
            <button type="button" onClick={() => setShowSpeech(!showSpeech)} className={`p-2.5 rounded-xl ${showSpeech ? "bg-teal-500/30 text-teal-300" : "bg-slate-800/70 text-slate-400 hover:text-slate-300"} transition-colors`} title="Voice input"><Mic size={18} /></button>
            <button type="button" onClick={() => setShowImageUpload(!showImageUpload)} className={`p-2.5 rounded-xl ${showImageUpload ? "bg-teal-500/30 text-teal-300" : "bg-slate-800/70 text-slate-400 hover:text-slate-300"} transition-colors`} title="Upload image"><Camera size={18} /></button>
            <button type="button" onClick={() => setShowReminders(!showReminders)} className={`p-2.5 rounded-xl ${showReminders ? "bg-teal-500/30 text-teal-300" : "bg-slate-800/70 text-slate-400 hover:text-slate-300"} transition-colors`} title="Medication reminder"><Pill size={18} /></button>
            <button type="button" onClick={() => setShowAppointments(!showAppointments)} className={`p-2.5 rounded-xl ${showAppointments ? "bg-teal-500/30 text-teal-300" : "bg-slate-800/70 text-slate-400 hover:text-slate-300"} transition-colors`} title="Schedule appointment"><Calendar size={18} /></button>
          </div>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-3 leading-relaxed">Vita provides general health information and does not substitute professional medical advice.</p>
      </div>
    </div>
  );
}
