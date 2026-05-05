import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import { useStatus } from "../hooks/useStatus";
import { FileText, Printer, Mail, User, Stethoscope, MessageSquare } from "lucide-react";
import { getCurrentHealthState } from "../services/healthGraph";

interface SpecialistOption {
  id: string;
  title: string;
  department: string;
  description: string;
}

const SPECIALISTS: SpecialistOption[] = [
  { id: "cardiology", title: "Cardiologist", department: "Heart & Vascular", description: "Heart rhythm, blood pressure, cholesterol management" },
  { id: "endocrinology", title: "Endocrinologist", department: "Hormones & Metabolism", description: "Diabetes, thyroid, hormone disorders" },
  { id: "dermatology", title: "Dermatologist", department: "Skin & Hair", description: "Skin conditions, rashes, lesions" },
  { id: "neurology", title: "Neurologist", department: "Brain & Nerves", description: "Headaches, seizures, nerve disorders" },
  { id: "gastroenterology", title: "Gastroenterologist", department: "Digestive Health", description: "Stomach, liver, bowel conditions" },
  { id: "pulmonology", title: "Pulmonologist", department: "Lungs & Breathing", description: "Asthma, COPD, breathing difficulties" },
  { id: "orthopedics", title: "Orthopedist", department: "Bones & Joints", description: "Fractures, arthritis, joint pain" },
  { id: "psychiatry", title: "Psychiatrist", department: "Mental Health", description: "Depression, anxiety, mood disorders" },
  { id: "general", title: "General Practitioner", department: "Primary Care", description: "Routine checkups, preventive care" },
];

export default function ReferralGenerator() {
  const { user } = useAuth();
  const { showStatus } = useStatus();
  const health = getCurrentHealthState();

  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistOption | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const toggleCondition = (condName: string) => {
    setSelectedConditions(prev =>
      prev.includes(condName) ? prev.filter(c => c !== condName) : [...prev, condName]
    );
  };

  const handleGenerate = async () => {
    if (!selectedSpecialist) {
      showStatus("error", "Select Specialist", "Please select a specialist type.");
      return;
    }
    setGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setGenerated(true);
    } catch {
      showStatus("error", "Failed", "Could not generate referral.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // In production: would open email client with prefilled fields
    showStatus("success", "Email Ready", "Your default email client will open with the referral letter.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
    >
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold text-white mb-2">Referral Letter Generator</h1>
        <p className="text-slate-400 text-sm mb-6">
          Create a professional referral letter for your specialist appointment
        </p>

        {!generated ? (
          <div className="space-y-6">
            {/* Specialist selection */}
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold text-white mb-3">1. Select Specialist</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SPECIALISTS.map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedSpecialist(spec)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedSpecialist?.id === spec.id
                        ? "bg-teal-500/15 border-teal-500/40"
                        : "bg-slate-800/30 border-slate-700/30 hover:border-teal-500/30"
                    }`}
                  >
                    <div className="font-medium text-white text-sm">{spec.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{spec.department}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditions selection */}
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold text-white mb-3">2. Relevant Conditions</h2>
              <p className="text-slate-400 text-xs mb-3">
                Select conditions relevant to this referral
              </p>
              {!health.conditions?.length ? (
                <p className="text-slate-500 text-sm">No conditions recorded in your health graph.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {health.conditions?.map((cond: any) => (
                    <button
                      key={cond.id}
                      onClick={() => toggleCondition(cond.name)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        selectedConditions.includes(cond.name)
                          ? "bg-teal-500/20 border-teal-500/40 text-teal-200"
                          : "bg-slate-800/40 border-slate-700/30 text-slate-300 hover:border-teal-500/30"
                      }`}
                    >
                      {cond.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold text-white mb-3">3. Additional Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Include any additional context for the specialist..."
                className="glass-input w-full px-4 py-3 text-sm resize-none"
              />
            </div>

            {/* Generate */}
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedSpecialist}
              className="w-full px-5 py-3.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Generate Referral Letter
                </>
              )}
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Referral Letter</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors flex items-center gap-2"
                  >
                    <Printer size={14} />
                    Print
                  </button>
                  <button
                    onClick={handleEmail}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm text-white transition-colors flex items-center gap-2"
                  >
                    <Mail size={14} />
                    Email
                  </button>
                </div>
              </div>

              <div className="bg-white text-slate-900 p-6 rounded-xl font-serif text-sm leading-relaxed">
                <p className="mb-4">
                  <strong>Dear {selectedSpecialist?.title},</strong>
                </p>
                <p className="mb-4">
                  I am writing to refer my patient, <strong>{user?.fullName || "Patient"}</strong>, for a consultation regarding{" "}
                  {selectedConditions.length > 0
                    ? selectedConditions.join(", ")
                    : "health concerns"}.
                </p>
                <p className="mb-4">
                  <strong>Relevant History:</strong> The patient has been diagnosed with the following condition(s):
                </p>
                <ul className="list-disc pl-5 mb-4">
                  {health.conditions?.map((cond: any) => (
                    <li key={cond.id}>{cond.name} (diagnosed {new Date(cond.diagnosedDate).toLocaleDateString()})</li>
                  ))}
                </ul>
                {notes && (
                  <p className="mb-4">
                    <strong>Additional Notes:</strong> {notes}
                  </p>
                )}
                <p className="mb-2">
                  Please evaluate and provide your recommendations. The patient's full health record is available in VitaChain upon request.
                </p>
                <p className="mt-6">
                  Sincerely,<br />
                  <strong>
                    {user?.fullName || "VitaChain Patient"}
                    {user?.emailAddresses?.[0]?.emailAddress && (
                      <><br />{user.emailAddresses[0].emailAddress}</>
                    )}
                  </strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setGenerated(false)}
              className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm text-white transition-colors"
            >
              Start New Referral
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
