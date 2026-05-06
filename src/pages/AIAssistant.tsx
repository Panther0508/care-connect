import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
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
  X, Send, Mic, ArrowLeft, AlertCircle, CheckCircle, FileText, Image, Calendar, Pill, Globe, Volume2, VolumeX, Camera, Clock, Plus
} from "lucide-react";
import { getUserProfile } from "../lib/idb";
import { useRole } from "../hooks/auth/useRole";
import LoadingSpinner from "../components/LoadingSpinner";

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
  reasoning?: Array<{ type: string; title: string; description: string; sources?: string[] }>;
  citations?: Array<{ type: string; title: string; url: string; snippet?: string; source: string }>;
  emotionalState?: string;
  model?: string;
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
          // Try to get user profile from IndexedDB
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
           reasoning: summaryResult.reasoning,
           citations: summaryResult.citations,
           emotionalState: summaryResult.emotionalState,
           model: summaryResult.model
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
                reasoning: aiResult.reasoning,
                citations: aiResult.citations,
                emotionalState: aiResult.emotionalState,
                model: aiResult.model
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
                reasoning: aiResult.reasoning,
                citations: aiResult.citations,
                emotionalState: aiResult.emotionalState,
                model: aiResult.model
              });
              setActiveModel('offline');
            } finally {
              setIsProcessing(false);
            }
          }).catch(async () => {
            // Fallback if loadEmbeddingModel fails
            const aiResult = await askMedicalQuestion(healthState, text, systemPrompt, userRole, userId);
            addMessage("assistant", aiResult.text, {
              reasoning: aiResult.reasoning,
              citations: aiResult.citations,
              emotionalState: aiResult.emotionalState,
              model: aiResult.model
            });
            setActiveModel('offline');
            setIsProcessing(false);
          });
          return;
        }

        // Default: free-form question - use streaming
        setIsStreaming(true);

        // Create placeholder message for streaming
        const tempId = Date.now();
        addMessage("assistant", "", { tempId });

        try {
          // Stream the response
          const streamGen = askMedicalQuestionStream(healthState, text, systemPrompt, userRole, userId);
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

          // Finalize message with metadata
          setMessages(prev => {
            const newMsgs = [...prev];
            const lastIdx = newMsgs.length - 1;
            if (newMsgs[lastIdx]?.tempId === tempId) {
              newMsgs[lastIdx] = {
                role: 'assistant',
                content: fullText,
                reasoning: metadata.reasoning,
                citations: metadata.citations,
                emotionalState: metadata.emotionalState,
                model: metadata.model
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

       <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
         {!modelLoaded && (
           <div className="flex flex-col items-center justify-center py-24 text-center px-6">
             <LoadingSpinner size={96} />
             <p className="text-amber-400 font-semibold text-lg mb-2">Loading AI Engine</p>
             <p className="text-slate-500 text-sm">Downloading TinyLlama 1.1B — first load only.</p>
           </div>
         )}

          <AnimatePresence mode="pop-layout">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isSystem = msg.role === "system";
              const isAssistant = msg.role === "assistant";
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 18, scale: 0.96, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.94, filter: "blur(3px)" }}
                  transition={{
                    duration: 0.32,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  data-message-role={msg.role}
                  data-message-type={isUser ? 'user' : 'bot'}
                >
                  <div className={`flex gap-3 max-w-full sm:max-w-[88%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    {!isUser && !isSystem && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                        className="flex-shrink-0 mt-0.5"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center shadow-sm">
                          <span className="text-xs text-teal-300 font-bold">AI</span>
                        </div>
                      </motion.div>
                    )}
                    <div>
                      {/* Main message bubble */}
                      <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={`rounded-2xl px-4 py-3 ${isUser ? "bg-gradient-to-r from-teal-500/30 to-cyan-500/20 text-slate-100 border border-teal-500/20" : isSystem ? "bg-amber-500/10 text-amber-200 border border-amber-500/20 text-sm" : "glass-card text-slate-200"}`}
                      >
                        {isUser ? (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</div>
                        ) : (
                          <div className="text-base leading-relaxed prose prose-invert max-w-none prose-p:mb-2 prose-headings:mt-3 prose-headings:mb-1 prose-ul:my-2 prose-ol:my-2 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-code:text-teal-300">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </motion.div>

                      {/* Message actions for assistant messages */}
                      {isAssistant && !isStreaming && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="mt-1.5 ml-2 group"
                        >
                          <MessageActions content={msg.content} />
                        </motion.div>
                      )}

                      {/* Emotional state indicator for assistant */}
                      {isAssistant && msg.emotionalState && (
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 }}
                          className="mt-1.5 ml-2 flex items-center gap-1.5"
                        >
                          <span title={`Emotional state: ${msg.emotionalState}`}>{EMOJI_MAP[msg.emotionalState] || '⚪'}</span>
                          {msg.emotionalState !== 'neutral' && (
                            <span className="text-xs text-slate-400 capitalize">{msg.emotionalState}</span>
                          )}
                        </motion.div>
                      )}

                      {/* Streaming indicator */}
                      {isStreaming && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-2 ml-2 flex items-center gap-2 text-xs text-teal-400"
                        >
                          <motion.div
                            className="w-2 h-2 bg-teal-400 rounded-full"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <span>Thinking and writing...</span>
                        </motion.div>
                      )}

                      {/* Reasoning panel */}
                      {isAssistant && msg.reasoning && msg.reasoning.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ delay: 0.25, duration: 0.3 }}
                          className="mt-2 ml-2 overflow-hidden"
                        >
                          <ReasoningPanel reasoningSteps={msg.reasoning} />
                        </motion.div>
                      )}

                      {/* Citations */}
                      {isAssistant && msg.citations && msg.citations.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="mt-2 ml-2 flex flex-wrap items-center gap-2"
                        >
                          {msg.citations.map((c, i) => (
                            <CitationBadge key={i} citation={c} index={i} />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

        {isProcessing && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex items-start gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-xl bg-slate-800/70 border border-slate-700/50 flex items-center justify-center flex-shrink-0"
            >
              <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full" />
            </motion.div>
            <div className="glass-card px-4 py-3">
              <div className="text-slate-300 text-sm space-y-2">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-teal-400 rounded-full" />
                  <span>Searching your health records...</span>
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-teal-400 rounded-full" />
                  <span>Consulting medical knowledge base...</span>
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-teal-400 rounded-full" />
                  <span>Preparing your personalized answer</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

          {messages.length > 0 && modelLoaded && (
            <ScrollReveal delay={100}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } },
                }}
                className="px-4 pb-4"
              >
                <p className="text-xs text-slate-500 mb-2">Quick actions</p>
                <div className="flex flex-wrap gap-2">
                  {/* Static quick prompts */}
                  {QUICK_PROMPTS.map((prompt) => (
                    <motion.button
                      key={prompt.label}
                      variants={{
                        hidden: { opacity: 0, y: 8, scale: 0.95 },
                        visible: { opacity: 1, y: 0, scale: 1 },
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSend(prompt.label)}
                      disabled={isProcessing || isStreaming}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/15 to-cyan-500/10 hover:from-teal-500/25 hover:to-cyan-500/20 border border-teal-500/40 hover:border-teal-400/60 text-slate-100 text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(20,184,166,0.25)] min-h-[44px]"
                    >
                      {prompt.label}
                    </motion.button>
                  ))}
                  {/* Dynamic context-aware prompts */}
                  {dynamicQuickActions.map((prompt, idx) => (
                    <motion.button
                      key={`dynamic-${idx}-${prompt.handler}`}
                      variants={{
                        hidden: { opacity: 0, y: 8, scale: 0.95 },
                        visible: { opacity: 1, y: 0, scale: 1 },
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSend(getDynamicPromptText(prompt.handler))}
                      disabled={isProcessing || isStreaming}
                      className="px-5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-slate-600/50 hover:border-teal-500/40 text-slate-200 text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(20,184,166,0.15)] min-h-[44px]"
                    >
                      {prompt.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </ScrollReveal>
           )}

        <div className="sticky bottom-0 bg-slate-900/90 backdrop-blur-2xl border-t border-white/5 p-4">
        <AnimatePresence>
          {showTranslation && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-slate-800/50 border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-teal-400" />
                <span className="text-slate-300">Translate to:</span>
                <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="bg-slate-900 text-slate-100 text-sm rounded px-3 py-1.5 border border-slate-700">
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
                <button onClick={handleSpeechInput} className={`text-sm px-4 py-2 rounded-lg ${isRecording ? "bg-red-500/20 text-red-300" : "bg-teal-500/20 text-teal-300"} transition-all`}>{isRecording ? "Listening" : "Click to speak"}</button>
              </div>
            </motion.div>
          )}
          {showTTS && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-slate-800/50 border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                {isSpeakingNow ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
                <span className="text-slate-300">Text-to-Speech</span>
                 <button onClick={() => {
                   const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
                   if (lastAssistantMsg) {
                     handleTextToSpeech(lastAssistantMsg.content);
                   }
                 }} className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all">Play last</button>
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
               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm">
                 <Clock className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <input value={reminderForm.medicationName} onChange={(e) => setReminderForm({ ...reminderForm, medicationName: e.target.value })} placeholder="Medication" className="flex-1 bg-slate-900 text-slate-100 text-sm rounded px-3 py-2 border border-slate-700 min-w-0" />
                  <input type="time" value={reminderForm.time} onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })} className="bg-slate-900 text-slate-100 text-sm rounded px-3 py-2 border border-slate-700 flex-shrink-0" />
                  <button onClick={handleQuickReminder} className="text-sm px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-all flex-shrink-0">Set</button>
               </div>
             </motion.div>
           )}
           {showAppointments && (
             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-slate-800/50 border-b border-white/5 px-4 py-3">
               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm">
                 <Calendar className="w-4 h-4 text-teal-400 flex-shrink-0" />
                 <select value={appointmentForm.specialistType} onChange={(e) => setAppointmentForm({ ...appointmentForm, specialistType: e.target.value })} className="bg-slate-900 text-slate-100 text-sm rounded px-3 py-2 border border-slate-700 flex-shrink-0">
                   <option value="general">General</option>
                   <option value="cardiologist">Cardiologist</option>
                   <option value="endocrinologist">Endocrinologist</option>
                 </select>
                 <input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })} className="bg-slate-900 text-slate-100 text-sm rounded px-3 py-2 border border-slate-700 flex-shrink-0" />
                 <input type="time" value={appointmentForm.time} onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })} className="bg-slate-900 text-slate-100 text-sm rounded px-3 py-2 border border-slate-700 flex-shrink-0" />
                 <button onClick={handleQuickAppointment} className="text-sm px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-all flex-shrink-0">Schedule</button>
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
              className="glass-input w-full py-3 pr-12 text-base resize-none min-h-[48px] max-h-32"
            />
            <button type="button" onClick={() => handleSend(currentInput)} disabled={isProcessing || !currentInput.trim() || !modelLoaded} className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={16} />
            </button>
          </div>
          <div className="flex gap-1 relative">
            <button
              type="button"
              onClick={() => setShowToolMenu(!showToolMenu)}
              className={`p-2.5 rounded-xl ${showToolMenu ? "bg-teal-500/30 text-teal-300" : "bg-slate-800/70 text-slate-400 hover:text-slate-300"} transition-colors`}
              title="More tools"
            >
              <Plus size={18} />
            </button>
             {showToolMenu && (
               <motion.div
                 initial={{ opacity: 0, scale: 0.9, y: 10 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 className="absolute bottom-full left-0 right-0 mb-2 mx-auto w-48 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-lg z-50 overflow-hidden sm:w-48 sm:right-0 sm:left-auto"
               >
                 <div className="flex flex-col py-2">
                   <button type="button" onClick={() => { setShowTranslation(!showTranslation); setShowToolMenu(false); }} className="p-2.5 hover:bg-slate-700/50 text-slate-300 flex justify-center" title="Translate"><Globe size={18} /></button>
                   <button type="button" onClick={() => { setShowSpeech(!showSpeech); setShowToolMenu(false); }} className="p-2.5 hover:bg-slate-700/50 text-slate-300 flex justify-center" title="Voice input"><Mic size={18} /></button>
                   <button type="button" onClick={() => { setShowImageUpload(!showImageUpload); setShowToolMenu(false); }} className="p-2.5 hover:bg-slate-700/50 text-slate-300 flex justify-center" title="Upload image"><Camera size={18} /></button>
                   <button type="button" onClick={() => { setShowReminders(!showReminders); setShowToolMenu(false); }} className="p-2.5 hover:bg-slate-700/50 text-slate-300 flex justify-center" title="Medication reminder"><Pill size={18} /></button>
                   <button type="button" onClick={() => { setShowAppointments(!showAppointments); setShowToolMenu(false); }} className="p-2.5 hover:bg-slate-700/50 text-slate-300 flex justify-center" title="Schedule appointment"><Calendar size={18} /></button>
                 </div>
               </motion.div>
             )}
          </div>
        </form>
        <p className="text-sm text-slate-500 text-center mt-3 leading-relaxed">Vita provides general health information and does not substitute professional medical advice.</p>
      </div>

    </div>
  );
}
