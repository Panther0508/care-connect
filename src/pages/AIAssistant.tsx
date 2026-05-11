import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Global test-mode configuration
const IS_TEST_MODE = import.meta.env.VITE_E2E_MODE === 'true';
import VitaAvatar from "../components/VitaAvatar";
import CrisisPopup from "../components/CrisisPopup";
import ReasoningPanel from "../components/ReasoningPanel";
import CitationBadge from "../components/CitationBadge";
import MessageActions from "../components/MessageActions";
import QuotaIndicator from "../components/QuotaIndicator";
import ScrollReveal from "../components/ScrollReveal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  loadModel,
  isModelReady,
  generateClinicalSummary,
  generatePreVisitSummary,
  checkMedicationInteractionLLM,
  askMedicalQuestion,
  askMedicalQuestionStream,
  checkMedicationInteraction
} from "../services/medicalAI";
import { checkInteractionsSimple } from "../services/medicationChecker";
import { getCurrentHealthState } from "../services/healthGraph";
import { getAllRxNorm, getAllVectors, retrieveContext, getSetting, getItem } from "../lib/idb";
import { useStatus } from "../hooks/useStatus";
import { getPersona, buildSystemPrompt, generateGreeting } from "../services/personaEngine";
import { scanMessage, scanAIResponse } from "../services/crisisDetector";
import { showCrisisPopup, dismissCrisisPopup, registerCrisisHandler } from "../services/crisisManager";
import {
  X, Send, Mic, ArrowLeft, AlertCircle, CheckCircle, FileText, Image, Calendar, Pill, Globe, Volume2, VolumeX, Camera, Clock, Plus, Sparkles, Brain
} from "lucide-react";
import { getUserProfile } from "../lib/idb";
import { useRole } from "../hooks/auth/useRole";
import LoadingSpinner from "../components/LoadingSpinner";
import GlassCard from "../components/GlassCard";


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
  reasoningSteps?: Array<{
    step: number;
    action: string;
    icon: string;
    detail: string;
    duration_ms: number;
    source_urls?: string[];
    status: "complete" | "running" | "error" | "pending";
  }>;
  citations?: Array<{ index: number; url: string; title: string; snippet: string }>;
  emotionalState?: string;
  model?: string;
  responseTimeMs?: number;
}

const QUICK_PROMPTS = [
  { label: "Summarise my health", handler: "summary" },
  { label: "What are my care gaps?", handler: "gaps" },
  { label: "Check a new medication", handler: "interaction" },
  { label: "Generate passport summary", handler: "passport" },
];

// Context-aware dynamic prompts
const DYNAMIC_PROMPTS = {
  after_summary: [
    { label: "Explain my conditions", handler: "explain_conditions" },
    { label: "What should I monitor?", handler: "monitor" },
  ],
  after_meds: [
    { label: "Check interactions", handler: "interaction" },
    { label: "Set reminder for meds", handler: "reminder" },
  ],
  after_gaps: [
    { label: "Book a check-up", handler: "appointment" },
    { label: "Add missing records", handler: "add_records" },
  ],
  general: [
    { label: "Tell me more", handler: "tell_more" },
    { label: "Simplify this", handler: "simplify" },
  ]
};

export default function AIAssistant() {
  const navigate = useNavigate();
  const { showStatus, dismissStatus } = useStatus();
  const { user } = useAuth();
  const { role: userRole } = useRole();
  const loaderToastRef = useRef<string | null>(null);
  const lastSpokenIndex = useRef<number>(-1);

  // Emoji indicators for emotional state
  const EMOJI_MAP: Record<string, string> = {
    crisis: '🔴', distressed: '🟠', sad: '😢', anxious: '😰',
    frustrated: '😤', neutral: '⚪', curious: '🤔', grateful: '💙', happy: '😊'
  };
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
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [streamingSteps, setStreamingSteps] = useState<Array<{
    step: number;
    action: string;
    icon: string;
    detail: string;
    duration_ms: number;
    source_urls?: string[];
    status: "complete" | "running" | "error" | "pending";
  }>>([]);

  // Load voice mode setting
  useEffect(() => {
    getSetting<boolean>('voice_mode_enabled').then(value => {
      if (value) setVoiceModeEnabled(true);
    });
  }, []);
  const [showReminders, setShowReminders] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [reminderForm, setReminderForm] = useState({ medicationName: "", time: "09:00", days: [0, 1, 2, 3, 4, 5, 6] });
  const [appointmentForm, setAppointmentForm] = useState({ specialistType: "general", date: "", time: "10:00", purpose: "" });
  const fileInputRef = useRef<any>(null);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [crisisVisible, setCrisisVisible] = useState(false);
  const [crisisState, setCrisisState] = useState<{ riskLevel: string; matchedPattern?: string }>({ riskLevel: "LOW" });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeModel, setActiveModel] = useState<'online' | 'cached' | 'offline' | null>(null);
  const [quotaRemaining, setQuotaRemaining] = useState(1500);
   const [modelType, setModelType] = useState<'gemma4-31b' | 'tinyllama-1.1b'>('gemma4-31b');
    const chatEndRef = useRef<HTMLDivElement>(null);
    // Streaming state
    const [isStreaming, setIsStreaming] = useState(false);
   const [currentChunk, setCurrentChunk] = useState("");
   // Dynamic quick actions based on context
   const [dynamicQuickActions, setDynamicQuickActions] = useState<Array<{label: string, handler: string}>>([]);

  // Update model status periodically
   // Update dynamic quick actions based on conversation context
   const updateDynamicQuickActions = useCallback((msgs: Message[]) => {
     if (msgs.length === 0) {
       setDynamicQuickActions([]);
       return;
     }

     // Find last assistant message
     const lastAssistantMsg = [...msgs].reverse().find(m => m.role === 'assistant');
     if (!lastAssistantMsg) {
       setDynamicQuickActions([]);
       return;
     }

     const content = lastAssistantMsg.content.toLowerCase();
     const actions: Array<{label: string, handler: string}> = [];

     // Context detection
     if (content.includes('summary') || content.includes('health summary')) {
       actions.push(...DYNAMIC_PROMPTS.after_summary);
     } else if (content.includes('medication') || content.includes('drug') || content.includes('interaction')) {
       actions.push(...DYNAMIC_PROMPTS.after_meds);
     } else if (content.includes('gap') || content.includes('missing') || content.includes('record')) {
       actions.push(...DYNAMIC_PROMPTS.after_gaps);
     } else {
       // Always show some context-aware options after any response
       actions.push(...DYNAMIC_PROMPTS.general.slice(0, 1)); // Only "Tell me more"
     }

     setDynamicQuickActions(actions);
   }, []);

    // Update dynamic actions whenever messages change
    useEffect(() => {
      updateDynamicQuickActions(messages);
    }, [messages, updateDynamicQuickActions]);

    // Auto-speak assistant responses when voice mode is enabled
    useEffect(() => {
      if (!voiceModeEnabled || messages.length === 0) return;
      const lastIdx = messages.length - 1;
      const lastMsg = messages[lastIdx];
      if (lastMsg.role === 'assistant' && lastIdx !== lastSpokenIndex.current) {
        speakText(lastMsg.content, { language: 'en' }).then(() => {
          setIsSpeakingNow(true);
        }).catch(err => {
          console.error('TTS failed:', err);
        });
        lastSpokenIndex.current = lastIdx;
      }
    }, [messages, voiceModeEnabled]);

  const getLanguageName = (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  // Map dynamic prompt handlers to actual question text
  const getDynamicPromptText = (handler: string): string => {
    switch (handler) {
      case 'explain_conditions': return 'Can you explain my conditions in more detail?';
      case 'monitor': return 'What symptoms or indicators should I monitor?';
      case 'interaction': return 'Check medication interactions for my current meds';
      case 'reminder': return 'Help me set up medication reminders';
      case 'appointment': return 'I want to book a check-up appointment';
      case 'add_records': return 'What health records am I missing?';
      case 'tell_more': return 'Tell me more about this';
      case 'simplify': return 'Can you explain that in simpler terms?';
      default: return handler;
    }
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
        // Try to get user profile from IndexedDB first
        const userId = (await getItem<string>('user_id')) || 'default-user';
        const profile = await getUserProfile(userId);
        if (profile) {
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
      // In test mode, force load the model immediately
      if (IS_TEST_MODE) {
        setLoadingModel(true);
        try {
          await loadModel();
          setModelLoaded(true);
          showStatus("success", "AI Engine Ready", "You can now use the assistant offline.");
        } catch (err) {
          console.error("Failed to load offline model:", err);
          setModelLoaded(true);
        } finally {
          setLoadingModel(false);
          if (loaderToastRef.current) {
            dismissStatus(loaderToastRef.current);
            loaderToastRef.current = null;
          }
        }
        return;
      }

      // Check if we're online first - if offline, skip model load
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log('Offline mode - skipping TinyLlama load, will use cache/fallback on first query');
        setModelLoaded(true); // Allow chat to work with offline/cached responses
        return;
      }

      // Only load model if user has actually interacted with AI (lazy load)
      const hasInteracted = localStorage.getItem('vita_ai_interacted');
      if (!hasInteracted) {
        console.log('Deferring AI model load until first user interaction');
        setModelLoaded(true); // Set to true to allow UI, actual lazy load will trigger on first send
        return;
      }

       try {
         setLoadingModel(true);
         loaderToastRef.current = showStatus(
           "loading",
           "Initialising AI Engine",
           "Loading offline model — this only happens once.",
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
         console.error("Failed to load offline model:", err);
         showStatus("warning", "AI Limited", "Offline model unavailable — using online mode only.");
         // Still mark as loaded to allow usage (will use online APIs)
         setModelLoaded(true);
       } finally {
         setLoadingModel(false);
         if (loaderToastRef.current) {
           dismissStatus(loaderToastRef.current);
           loaderToastRef.current = null;
         }
       }
    };
    prepareModel();
  }, []);

  const addMessage = (role: MessageRole, content: string, extra?: Partial<Omit<Message, 'role' | 'content'>>) => {
    setMessages((prev) => [...prev, { role, content, ...extra }]);
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
     try {
       if (isRecording) {
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
         const mediaRecorder = new MediaRecorder(stream);
         const audioChunks: Blob[] = [];
         
         mediaRecorder.ondataavailable = (event) => {
           audioChunks.push(event.data);
         };
         
         mediaRecorder.onstop = async () => {
           const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
           try {
             const result = await transcribeFromMic({ language: "en" });
             setCurrentInput(result.text);
           } catch (transcribeErr) {
             console.error("Transcription failed, using Web Speech fallback:", transcribeErr);
             if (window.SpeechRecognition || window.webkitSpeechRecognition) {
               const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
               const recognition = new SpeechRecognition();
               recognition.lang = 'en-US';
               recognition.onresult = (event) => {
                 setCurrentInput(event.results[0][0].transcript);
               };
               recognition.start();
             }
           }
           stream.getTracks().forEach(track => track.stop());
         };
         
         mediaRecorder.start();
         setTimeout(() => mediaRecorder.stop(), 3000);
       }
     } catch (err) {
       console.warn("Speech recognition unavailable:", err);
       if (window.SpeechRecognition || window.webkitSpeechRecognition) {
         try {
           const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
           const recognition = new SpeechRecognition();
           recognition.lang = 'en-US';
           recognition.onresult = (event) => {
             setCurrentInput(event.results[0][0].transcript);
           };
           recognition.start();
         } catch (webErr) {
           console.warn("Web Speech also failed:", webErr);
         }
       }
     }
     setIsRecording(!isRecording);
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

      // Cancel any ongoing speech
      if (isSpeakingNow) {
        cancelSpeech();
        setIsSpeakingNow(false);
      }

      // Mark that user has interacted (for future sessions)
      localStorage.setItem('vita_ai_interacted', 'true');

     // Lazy load model on first use if not loaded yet
     if (!modelLoaded) {
       setLoadingModel(true);
       try {
         await loadModel((progress: any) => {
           if (progress && progress.status === "downloading") {
             console.log(`Downloading: ${Math.round((progress.loaded || 0) / (progress.total || 1) * 100)}%`);
           }
         });
         setModelLoaded(true);
         showStatus("success", "AI Engine Ready", "You can now use the assistant offline.");
       } catch (err) {
         console.error("Failed to load TinyLlama model:", err);
         addMessage("system", "AI model failed to load. Some features may be limited.");
         setLoadingModel(false);
         return;
       } finally {
         setLoadingModel(false);
       }
     }

      setCurrentInput("");
      setIsProcessing(true);
      const requestStartTime = Date.now();

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
       const userId = user?.id || 'guest';

       // Check for quick prompt handlers
       if (text.includes("summary") || lowerText.includes("summarise my health") || lowerText.includes("summarize")) {
         if (!healthState.conditions.length && !healthState.medications.length && !healthState.allergies.length) {
           addMessage("assistant", "No health data available. Please add some records in the Health section first.");
           setIsProcessing(false);
           return;
         }
         const summaryResult = await generateClinicalSummary(healthState, systemPrompt, userId);
         const summary = summaryResult.text;
         const responseDetection = scanAIResponse(summary);
         if (responseDetection.requiresImmediatePopup) {
           setCrisisVisible(true);
           setCrisisState({ riskLevel: responseDetection.riskLevel, matchedPattern: responseDetection.matchedPatterns?.[0] });
         }
           addMessage("assistant", summary, {
             reasoningSteps: summaryResult.reasoningSteps,
             citations: summaryResult.citations,
             emotionalState: summaryResult.emotionalState,
             model: summaryResult.model,
             responseTimeMs: Date.now() - requestStartTime
           });
          // Update model status from last route result
          const lastRes = getLastRouteResult();
          if (lastRes?.source === 'online') setActiveModel('online');
          else if (lastRes?.source === 'cached-gemma') setActiveModel('cached');
          else if (lastRes?.source === 'offline') setActiveModel('offline');
          if (lastRes?.quotaRemaining !== undefined) setQuotaRemaining(lastRes.quotaRemaining);
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
            try {
              const retrieved = await retrieveRagContext(text, datasetMatch.dataset, 5);
              let aiResult;
               if (retrieved && retrieved.length > 0) {
                 const augmentedMessages = buildAugmentedPrompt(text, retrieved.slice(0, 3), systemPrompt || "");
                 aiResult = await askMedicalQuestion(healthState, text, augmentedMessages[0].content, userRole, userId);
               } else {
                 aiResult = await askMedicalQuestion(healthState, text, systemPrompt, userRole, userId);
                }
                addMessage("assistant", aiResult.text, {
                  reasoningSteps: aiResult.reasoningSteps,
                  citations: aiResult.citations,
                  emotionalState: aiResult.emotionalState,
                  model: aiResult.model,
                  responseTimeMs: Date.now() - requestStartTime
                });
               const lastRes = getLastRouteResult();
               if (lastRes?.source === 'online') setActiveModel('online');
               else if (lastRes?.source === 'cached-gemma') setActiveModel('cached');
               else setActiveModel('offline');
               if (lastRes?.quotaRemaining !== undefined) setQuotaRemaining(lastRes.quotaRemaining);
              } catch (innerErr) {
               console.error('RAG path error:', innerErr);
                const aiResult = await askMedicalQuestion(healthState, text, systemPrompt, userRole, userId);
                addMessage("assistant", aiResult.text, {
                  reasoningSteps: aiResult.reasoningSteps,
                  citations: aiResult.citations,
                  emotionalState: aiResult.emotionalState,
                  model: aiResult.model,
                  responseTimeMs: Date.now() - requestStartTime
                });
              setActiveModel('offline');
            } finally {
              setIsProcessing(false);
            }
           }).catch(async () => {
             // Fallback if loadEmbeddingModel fails
             const aiResult = await askMedicalQuestion(healthState, text, systemPrompt, userRole, userId);
                addMessage("assistant", aiResult.text, {
                  reasoningSteps: aiResult.reasoningSteps,
                  citations: aiResult.citations,
                  emotionalState: aiResult.emotionalState,
                  model: aiResult.model,
                  responseTimeMs: Date.now() - requestStartTime
                });
            setActiveModel('offline');
            setIsProcessing(false);
          });
          return;
        }

        // Default: free-form question - use streaming
        setIsStreaming(true);

        // Create placeholder message for streaming with empty reasoningSteps
        const tempId = Date.now();
        addMessage("assistant", "", { tempId, reasoningSteps: [] });

        try {
          // Stream the response with onStep callback for real-time reasoning
          const streamGen = askMedicalQuestionStream(healthState, text, systemPrompt, userRole, userId, (step) => {
            // Append incoming step to the placeholder message
            setMessages(prev => {
              const newMsgs = [...prev];
              const lastIdx = newMsgs.length - 1;
              if (newMsgs[lastIdx]?.tempId === tempId) {
                const currentSteps = newMsgs[lastIdx]?.reasoningSteps || [];
                // Avoid duplicate step numbers
                if (!currentSteps.some((s: any) => s.step === step.step)) {
                  newMsgs[lastIdx] = {
                    ...newMsgs[lastIdx],
                    reasoningSteps: [...currentSteps, step]
                  };
                }
              }
              return newMsgs;
            });
          });

          let fullText = "";
          let metadata: any = {};

          for await (const chunk of streamGen) {
            if (chunk.type === 'text') {
              fullText += chunk.content;
              // Update the last message with current text
              setMessages(prev => {
                const newMsgs = [...prev];
                const lastIdx = newMsgs.length - 1;
                if (newMsgs[lastIdx]?.tempId === tempId) {
                  newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: fullText };
                }
                return newMsgs;
              });
            } else if (chunk.type === 'metadata') {
              metadata = chunk;
            } else if (chunk.type === 'error') {
              throw new Error(chunk.error);
            }
          }

          // Finalize message with metadata (use final reasoningSteps from metadata if provided)
          setMessages(prev => {
            const newMsgs = [...prev];
            const lastIdx = newMsgs.length - 1;
            if (newMsgs[lastIdx]?.tempId === tempId) {
              newMsgs[lastIdx] = {
                role: 'assistant',
                content: fullText,
                reasoningSteps: metadata.reasoning || newMsgs[lastIdx]?.reasoningSteps || [],
                citations: metadata.citations,
                emotionalState: metadata.emotionalState,
                model: metadata.model,
                responseTimeMs: Date.now() - requestStartTime
              };
            }
            return newMsgs;
          });

          // Update model status from last route result
          const lastRes = getLastRouteResult();
          if (lastRes?.source === 'online') setActiveModel('online');
          else if (lastRes?.source === 'cached-gemma') setActiveModel('cached');
          else if (lastRes?.source === 'offline') setActiveModel('offline');
          if (lastRes?.quotaRemaining !== undefined) setQuotaRemaining(lastRes.quotaRemaining);
         } catch (err) {
           console.error('Streaming error:', err);
           // Replace placeholder with error message
           setMessages(prev => {
             const newMsgs = [...prev];
             const lastIdx = newMsgs.length - 1;
             if (newMsgs[lastIdx]?.tempId === tempId) {
               newMsgs[lastIdx] = { role: 'assistant', content: "Sorry, I encountered an error. Please try again." };
             }
             return newMsgs;
           });
         } finally {
           setIsStreaming(false);
           setIsProcessing(false);
         }
       } catch (err) {
         console.error(err);
         addMessage("assistant", "Sorry, I couldn't process that. Please try again.");
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
             <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-slate-300 hover:text-slate-100">
               <ArrowLeft size={22} />
             </button>
            <div className="relative">
              <VitaAvatar state="online" size={44} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 bg-teal-500" />
            </div>
             <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                 <h1 className="text-xl font-bold text-white leading-tight">Vita AI</h1>
                 {activeModel && (
                   <QuotaIndicator
                     remaining={quotaRemaining}
                     limit={1500}
                     model={activeModel === 'online' || activeModel === 'cached' ? 'gemma4-31b' : 'tinyllama-1.1b'}
                     source={activeModel}
                   />
                 )}
               </div>
               <p className="text-slate-400 text-xs">
                 {activeModel === 'online' && `Gemma 4 31B • Online mode • ${quotaRemaining.toLocaleString()}/1,500 queries`}
                 {activeModel === 'cached' && `Gemma 4 (cached) • Offline-capable • Responses cached`}
                 {activeModel === 'offline' && 'TinyLlama 1.1B • Fully offline'}
                 {!activeModel && 'Loading AI model...'}
               </p>
             </div>
          </div>
        </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
        {!modelLoaded && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <LoadingSpinner size={64} />
            <p className="text-teal-400 font-bold text-lg mt-4">Initialising AI Engine</p>
            <p className="text-slate-500 text-sm">Loading on-device intelligence...</p>
          </div>
        )}
        
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence mode="pop-layout">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isAssistant = msg.role === "assistant";
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? "order-1" : "order-2"}`}>
                    <GlassCard 
                      className={`p-4 md:p-5 ${
                        isUser 
                          ? "bg-teal-600/20 border-teal-500/30 text-white rounded-2xl rounded-tr-sm" 
                          : "bg-slate-800/40 border-white/5 text-slate-100 rounded-2xl rounded-tl-sm shadow-glass-loose"
                      }`}
                      depth={isUser ? "tight" : "loose"}
                      hover={false}
                    >
                      {isAssistant && (
                        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-teal-400/80">
                          <Sparkles size={12} />
                          Vita Intelligence
                        </div>
                      )}
                      <div className="prose prose-invert prose-sm max-w-none prose-p:mb-2 prose-headings:mt-4 prose-headings:mb-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      
                      {isAssistant && msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <ReasoningPanel steps={msg.reasoningSteps} />
                        </div>
                      )}

                      {isAssistant && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.citations.map((cite, cIdx) => (
                            <CitationBadge key={cIdx} index={cite.index} url={cite.url} title={cite.title} />
                          ))}
                        </div>
                      )}

                      {isAssistant && (
                        <div className="mt-3 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
                           <MessageActions 
                              content={msg.content} 
                              onSpeak={() => handleTextToSpeech(msg.content)}
                              isSpeaking={isSpeakingNow && lastSpokenIndex.current === idx}
                            />
                            {msg.responseTimeMs && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {(msg.responseTimeMs / 1000).toFixed(2)}s
                              </span>
                            )}
                        </div>
                      )}
                    </GlassCard>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isProcessing && !isStreaming && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <GlassCard className="p-4 bg-slate-800/40 border-white/5 rounded-2xl rounded-tl-sm" hover={false}>
                <div className="flex gap-1.5 items-center">
                   <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" />
                   </div>
                   <span className="text-xs text-slate-500 font-medium ml-2">Consulting health graph...</span>
                </div>
              </GlassCard>
            </motion.div>
          )}
          <div ref={chatEndRef} className="h-4" />
        </div>
      </main>

      <footer className="sticky bottom-0 z-30 p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence>
            {(showTranslation || showSpeech || showImageUpload || showReminders || showAppointments) && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden"
              >
                {showTranslation && (
                  <div className="p-3 flex items-center gap-3 border-b border-white/5">
                    <Globe size={16} className="text-teal-400" />
                    <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="flex-1 bg-transparent text-sm text-white focus:outline-none">
                      <option value="auto">Auto Translate</option>
                      {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                  </div>
                )}
                {showReminders && (
                  <div className="p-3 flex items-center gap-3 border-b border-white/5">
                    <Pill size={16} className="text-teal-400" />
                    <input value={reminderForm.medicationName} onChange={(e) => setReminderForm({ ...reminderForm, medicationName: e.target.value })} placeholder="Medication..." className="flex-1 bg-transparent text-sm text-white focus:outline-none" />
                    <button onClick={handleQuickReminder} className="text-xs font-bold text-teal-400 uppercase">Set</button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[...QUICK_PROMPTS, ...dynamicQuickActions].map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend('handler' in qp ? getDynamicPromptText(qp.handler) : qp.label)}
                className="whitespace-nowrap px-4 py-2 bg-slate-800/50 hover:bg-teal-500/10 border border-white/5 hover:border-teal-500/30 rounded-full text-xs font-bold text-slate-400 hover:text-teal-400 transition-all"
              >
                {qp.label}
              </button>
            ))}
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-teal-500/5 blur-2xl group-focus-within:bg-teal-500/10 transition-all rounded-full" />
            <GlassCard className="relative flex items-center gap-2 p-2 pl-4 rounded-2xl border-white/10" depth="loose">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend(currentInput)}
                placeholder="Ask Vita anything..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 text-sm font-medium py-2"
              />
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowToolMenu(!showToolMenu)}
                  className={`p-2 rounded-xl transition-all ${showToolMenu ? "bg-teal-500/20 text-teal-400" : "hover:bg-white/5 text-slate-500 hover:text-slate-300"}`}
                >
                  <Plus size={20} />
                </button>
                <button
                  onClick={() => handleSend(currentInput)}
                  disabled={!currentInput.trim() || isProcessing}
                  className="p-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-xl shadow-lg shadow-teal-900/20 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>

              <AnimatePresence>
                {showToolMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: -20 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute bottom-full right-0 mb-4 w-48 bg-slate-800/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="flex flex-col p-1">
                      <button onClick={() => { setShowImageUpload(true); setShowToolMenu(false); }} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl text-sm text-slate-300 transition-colors">
                        <Camera size={18} className="text-teal-400" />
                        Analyze Skin
                      </button>
                      <button onClick={() => { setShowReminders(true); setShowToolMenu(false); }} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl text-sm text-slate-300 transition-colors">
                        <Pill size={18} className="text-teal-400" />
                        Set Reminder
                      </button>
                      <button onClick={() => { setShowTranslation(true); setShowToolMenu(false); }} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl text-sm text-slate-300 transition-colors">
                        <Globe size={18} className="text-teal-400" />
                        Translate
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </div>
        </div>
      </footer>
    </div>
  );
}
