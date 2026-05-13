import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Brain,
  Heart,
  MessageCircle,
  Send,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Frown,
  Meh,
  Smile,
  LucideIcon,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { askMedicalQuestion, isModelReady, loadModel } from "../services/medicalAI";
import { v4 as uuidv4 } from "uuid";
import { getDB, storeMentalHealthLog } from "../lib/idb";
import { useStatus } from "../hooks/useStatus";

interface Question {
  id: string;
  text: string;
  options: { value: number; label: string }[];
}

const PHQ9_QUESTIONS: Question[] = [
  { id: "phq1", text: "Little interest or pleasure in doing things", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "phq2", text: "Feeling down, depressed, or hopeless", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "phq3", text: "Trouble falling or staying asleep, or sleeping too much", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "phq4", text: "Feeling tired or having little energy", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "phq5", text: "Poor appetite or overeating", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "phq6", text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "phq7", text: "Trouble concentrating on things, such as reading the newspaper or watching television", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "phq8", text: "Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "phq9", text: "Thoughts that you would be better off dead, or of hurting yourself in some way", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
];

const GAD7_QUESTIONS: Question[] = [
  { id: "gad1", text: "Feeling nervous, anxious, or on edge", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "gad2", text: "Not being able to stop or control worrying", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "gad3", text: "Worrying too much about different things", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "gad4", text: "Trouble relaxing", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "gad5", text: "Being so restless that it is hard to sit still", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "gad6", text: "Becoming easily annoyed or irritable", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
  { id: "gad7", text: "Feeling afraid as if something awful might happen", options: Array.from({ length: 4 }, (_, i) => ({ value: i, label: ["Not at all", "Several days", "More than half the days", "Nearly every day"][i] })) },
];

const INTERPRETATION = {
  phq9: [
    { min: 0, max: 4, label: "Minimal depression", color: "text-green-400", icon: Smile },
    { min: 5, max: 9, label: "Mild depression", color: "text-yellow-400", icon: Meh },
    { min: 10, max: 14, label: "Moderate depression", color: "text-orange-400", icon: Frown },
    { min: 15, max: 19, label: "Moderately severe depression", color: "text-red-400", icon: AlertTriangle },
    { min: 20, max: 27, label: "Severe depression", color: "text-red-500", icon: AlertTriangle },
  ],
  gad7: [
    { min: 0, max: 4, label: "Minimal anxiety", color: "text-green-400", icon: Smile },
    { min: 5, max: 9, label: "Mild anxiety", color: "text-yellow-400", icon: Meh },
    { min: 10, max: 14, label: "Moderate anxiety", color: "text-orange-400", icon: Frown },
    { min: 15, max: 21, label: "Severe anxiety", color: "text-red-400", icon: AlertTriangle },
  ],
};

export default function MentalHealthPage() {
  const { user } = useAuth();
  const { showStatus } = useStatus();
  const [activeTab, setActiveTab] = useState<"phq9" | "gad7">("phq9");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; interpretation: string; color: string; icon: LucideIcon } | null>(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showResources, setShowResources] = useState(false);

  const questions = activeTab === "phq9" ? PHQ9_QUESTIONS : GAD7_QUESTIONS;
  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  const selectOption = (qid: string, value: number) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  const calculateScore = () => {
    const total = questions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
    const range = INTERPRETATION[activeTab].find(r => total >= r.min && total <= r.max)!;
    setResult({ score: total, interpretation: range.label, color: range.color, icon: range.icon });
  };

   const saveResult = async () => {
     if (!user || !result) return;
     const log = {
       userId: user.id,
       type: activeTab,
       score: result.score,
       interpretation: result.interpretation,
       responses: answers,
       timestamp: Date.now(),
       date: new Date().toISOString().split("T")[0],
     };
     try {
       const db = await getDB();
       await storeMentalHealthLog(log);
     } catch (err) {
       console.error("Failed to save mental health log:", err);
       showStatus('error', 'Save Failed', 'Could not save your assessment result.');
     }
   };

  const handleViewResult = () => {
    calculateScore();
    saveResult();
  };

   const startAiChat = async () => {
     if (!result || !user) return;
     setAiLoading(true);
     const summary = `I completed the ${activeTab === "phq9" ? "PHQ-9" : "GAD-7"} questionnaire. My score was ${result.score} (${result.interpretation}). Can you provide some supportive advice?`;
     try {
       // We'd ideally get health state here, but for now pass minimal context
       const response = await askMedicalQuestion({ conditions: [], medications: [], allergies: [] }, summary);
       setAiMessages([{ role: "user", content: summary }, { role: "assistant", content: response }]);
       setShowAiChat(true);
     } catch (err) {
       console.error(err);
       showStatus('error', 'AI Error', 'Could not generate supportive advice. Please try again.');
     } finally {
       setAiLoading(false);
     }
   };

   const sendAiMessage = async () => {
     if (!aiInput.trim() || aiLoading) return;
     const userMsg = aiInput;
     setAiMessages(prev => [...prev, { role: "user", content: userMsg }]);
     setAiInput("");
     setAiLoading(true);
     try {
       // Contextualize with previous conversation
       const context = aiMessages.map(m => `${m.role}: ${m.content}`).join("\n");
       const response = await askMedicalQuestion({ conditions: [], medications: [], allergies: [] }, context + "\n\nUser: " + userMsg);
       setAiMessages(prev => [...prev, { role: "assistant", content: response }]);
     } catch (err) {
       console.error(err);
       showStatus('error', 'Send Failed', 'Could not send message. Try again.');
       setAiMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I encountered an error. Please try again." }]);
     } finally {
       setAiLoading(false);
     }
   };

  const ResourceIcon = result?.icon || Brain;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="text-teal-400" />
          Mental Health
        </h1>
        <p className="text-slate-400 text-sm">Confidential screenings & support</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab("phq9"); setResult(null); setAnswers({}); setShowAiChat(false); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "phq9" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "bg-slate-800/40 text-slate-400 border border-transparent"}`}
        >
          PHQ-9 (Depression)
        </button>
        <button
          onClick={() => { setActiveTab("gad7"); setResult(null); setAnswers({}); setShowAiChat(false); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "gad7" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "bg-slate-800/40 text-slate-400 border border-transparent"}`}
        >
          GAD-7 (Anxiety)
        </button>
      </div>

      {!result ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Over the last 2 weeks, how often have you been bothered by the following problems?
          </p>
          {questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30"
            >
              <p className="text-slate-200 text-sm mb-3">{q.text}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => selectOption(q.id, opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      answers[q.id] === opt.value
                        ? "bg-teal-500 text-white"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}

          <button
            onClick={handleViewResult}
            disabled={!allAnswered}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2 mt-4"
          >
            See Results
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Result Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`bg-slate-800/60 rounded-2xl p-6 border-2 ${result.color.replace("text", "border")}/30`}
          >
            <div className="text-center">
              <div className={`w-20 h-20 ${result.color.replace("text", "bg")}/20 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <ResourceIcon size={40} className={result.color} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Score: {result.score}/{questions.length * 3}</h2>
              <p className={`text-lg font-medium ${result.color}`}>{result.interpretation}</p>
            </div>

            {(activeTab === "phq9" && result.score >= 10) || (activeTab === "gad7" && result.score >= 10) ? (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-200 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  Your score suggests moderate or higher symptoms. It is recommended to discuss these results with a healthcare professional.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                <p className="text-sm text-teal-200 flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                  Your score is in the minimal range. Continue monitoring your wellbeing.
                </p>
              </div>
            )}
          </motion.div>

          {/* Resources */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white mb-2">Resources</h3>
            {activeTab === "phq9" ? (
              <>
                <a href="https://www.nimh.nih.gov/health/topics/depression" target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-teal-500/30 transition-colors">
                  <p className="text-sm text-slate-200">NIH Depression Information</p>
                  <p className="text-xs text-slate-400">Learn about signs, symptoms, and treatment</p>
                </a>
                <a href="https://suicidepreventionlifeline.org/" target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-teal-500/30 transition-colors">
                  <p className="text-sm text-slate-200">988 Suicide & Crisis Lifeline</p>
                  <p className="text-xs text-slate-400">24/7 free, confidential support</p>
                </a>
              </>
            ) : (
              <>
                <a href="https://www.nimh.nih.gov/health/topics/anxiety-disorders" target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-teal-500/30 transition-colors">
                  <p className="text-sm text-slate-200">NIH Anxiety Information</p>
                  <p className="text-xs text-slate-400">Understanding anxiety disorders</p>
                </a>
                <a href="https://suicidepreventionlifeline.org/" target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-teal-500/30 transition-colors">
                  <p className="text-sm text-slate-200">988 Crisis Support</p>
                  <p className="text-xs text-slate-400">Call or text 988 anytime</p>
                </a>
              </>
            )}
          </div>

          {/* AI Chat */}
          {!showAiChat ? (
            <button
              onClick={startAiChat}
              disabled={aiLoading}
              className="w-full py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              {aiLoading ? "Loading Vita AI..." : "Discuss Results with Vita AI"}
            </button>
          ) : (
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 flex flex-col h-80">
              <div className="p-3 border-b border-slate-700/30">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MessageCircle size={16} />
                  Vita AI Conversation
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {aiMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-teal-500/20 text-teal-100" : "bg-slate-800/60 text-slate-200 border border-slate-700/40"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="text-slate-400 text-xs italic">Vita is typing...</div>
                )}
              </div>
              <div className="p-2 border-t border-slate-700/30 flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendAiMessage()}
                  placeholder="Ask a follow-up..."
                  className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200"
                />
                <button onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()} className="px-3 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg">
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => { setResult(null); setAnswers({}); setShowAiChat(false); }}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
          >
            Retake Assessment
          </button>
        </div>
      )}
    </motion.div>
  );
}
