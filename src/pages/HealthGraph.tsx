// src/pages/HealthGraph.tsx
// Personal Health Graph page – encrypted CRDT health records

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VitaAvatar from "../components/VitaAvatar";
import MagnifyingLoader from "../components/MagnifyingLoader";
import BarcodeScanner from "../components/BarcodeScanner";
import ScrollReveal from "../components/ScrollReveal";
import {
  initHealthGraph,
  addCondition,
  addMedication,
  addAllergy,
  addEncounter,
  removeCondition,
  removeMedication,
  removeAllergy,
  removeEncounter,
  getCurrentHealthState,
} from "../services/healthGraph";
import { getMedicationByBarcode } from "../services/medicationLookup";
import { ChevronRight, Heart, ScanBarcode, Pill, AlertTriangle, Calendar, Plus, X, Upload, FileText, CheckCircle } from 'lucide-react';
import { useStatus } from "../hooks/useStatus";
import type { Condition, Medication, Allergy, Encounter } from "../lib/crdtHealthGraph";

type ModalType = 'condition' | 'medication' | 'allergy' | 'encounter' | null;

export default function HealthGraph() {
  const { showStatus } = useStatus();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [formData, setFormData] = useState({
    conditionName: "",
    diagnosedDate: "",
    conditionNotes: "",
    medicationName: "",
    medicationDose: "",
    medicationFreq: "",
    medicationStart: "",
    medicationEnd: "",
    allergySubstance: "",
    allergyReaction: "",
    allergySeverity: "mild" as "mild" | "moderate" | "severe",
    encounterDate: "",
    encounterFacility: "",
    encounterReason: "",
    encounterNotes: "",
  });

  // OCR state
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [ocrExplanation, setOcrExplanation] = useState<string>("");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [ocrError, setOcrError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    const state = getCurrentHealthState();
    setConditions(state.conditions);
    setMedications(state.medications);
    setAllergies(state.allergies);
    setEncounters(state.encounters);
    setLoading(false);
  };

   useEffect(() => {
     const init = async () => {
       try {
         await initHealthGraph();
         refreshData();
       } catch (err) {
         console.error("Failed to initialize health graph:", err);
         showStatus('error', 'Load Failed', 'Could not load health data.');
         setLoading(false);
       }
     };
     init();
   }, []);

  const openAddModal = (type: ModalType) => {
    setModalOpen(type);
    setFormData({
      conditionName: "",
      diagnosedDate: "",
      conditionNotes: "",
      medicationName: "",
      medicationDose: "",
      medicationFreq: "",
      medicationStart: "",
      medicationEnd: "",
      allergySubstance: "",
      allergyReaction: "",
      allergySeverity: "mild",
      encounterDate: "",
      encounterFacility: "",
      encounterReason: "",
      encounterNotes: "",
    });
  };

  const closeModal = () => setModalOpen(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCondition = async () => {
    await addCondition(formData.conditionName, formData.diagnosedDate, formData.conditionNotes);
    refreshData();
    closeModal();
  };

  const handleAddMedication = async () => {
    await addMedication(
      formData.medicationName,
      formData.medicationDose,
      formData.medicationFreq,
      formData.medicationStart,
      formData.medicationEnd || undefined
    );
    refreshData();
    closeModal();
  };

  const handleAddAllergy = async () => {
    await addAllergy(formData.allergySubstance, formData.allergyReaction, formData.allergySeverity);
    refreshData();
    closeModal();
  };

  const handleAddEncounter = async () => {
    await addEncounter(
      formData.encounterDate,
      formData.encounterFacility,
      formData.encounterReason,
      formData.encounterNotes || undefined
    );
    refreshData();
    closeModal();
  };

  const handleDelete = async (type: string, id: string) => {
    switch (type) {
      case "condition":
        await removeCondition(id);
        break;
      case "medication":
        await removeMedication(id);
        break;
      case "allergy":
        await removeAllergy(id);
        break;
      case "encounter":
        await removeEncounter(id);
        break;
    }
    refreshData();
  };

  // OCR handlers
   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     setOcrStatus("processing");
     setOcrError("");
     setOcrText("");
     setOcrExplanation("");
     setOcrImage(URL.createObjectURL(file));

     try {
       const TesseractGlobal = (window as any).Tesseract;
       if (!TesseractGlobal) {
         throw new Error("OCR engine not loaded. Please ensure you have an internet connection to load Tesseract.");
       }
       const { data: { text } } = await TesseractGlobal.recognize(file, 'eng', {
         logger: m => console.log(m)
       });
       setOcrText(text);

      // Generate plain-language explanation using medical AI
      try {
        const { askMedicalQuestion } = await import('../services/medicalAI');
        const healthState = getCurrentHealthState();
        const prompt = `I have extracted the following text from a medical lab report or prescription:\n\n"${text}"\n\nPlease provide a clear, plain-language explanation of what this text means for the patient. If you can identify specific lab values, medications, or diagnoses, explain them in simple terms and indicate whether they appear normal (green), borderline (amber), or concerning (red). Keep the explanation concise and actionable.`;
        const explanation = await askMedicalQuestion(healthState, prompt);
        setOcrExplanation(explanation);
      } catch (aiErr) {
        console.error('AI explanation failed:', aiErr);
        setOcrExplanation("Could not generate AI explanation. Please consult your healthcare provider.");
      }

      setOcrStatus("done");
    } catch (err: any) {
      console.error('OCR failed:', err);
      setOcrError(err.message || 'Failed to extract text from image');
      setOcrStatus("error");
    }
  };

  const clearOcr = () => {
    setOcrImage(null);
    setOcrText("");
    setOcrExplanation("");
    setOcrStatus("idle");
    setOcrError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: any[],
    emptyMessage: string,
    addLabel: string,
    modalType: ModalType,
    renderItem: (item: any) => React.ReactNode
  ) => (
    <ScrollReveal delay={0}>
      <div className="glass-card p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openAddModal(modalType)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-2xl text-sm transition-all duration-200 min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            {addLabel}
          </motion.button>
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-6 text-center rounded-2xl"
          >
            <p className="text-slate-400 text-sm">{emptyMessage}</p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05, delayChildren: 0.1 },
              },
            }}
            className="space-y-3"
          >
            {items.map((item) => (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { opacity: 0, x: -12, scale: 0.97 },
                  visible: { opacity: 1, x: 0, scale: 1 },
                }}
                layout
                className="glass-card p-4 rounded-xl relative group hover:border-teal-400/30 transition-all duration-200"
              >
                {renderItem(item)}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(modalType!, item.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-rose-400 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
                  title="Delete"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </ScrollReveal>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="glass-card p-8 rounded-2xl flex flex-col items-center gap-4">
          <MagnifyingLoader size={40} />
          <p className="text-slate-400 text-sm">Loading your health records...</p>
        </div>
      </div>
    );
  }

   return (
     <div className="space-y-6 p-4 pb-24">
       <ScrollReveal>
         <header className="flex items-center gap-4 md:gap-6">
           <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ type: "spring", stiffness: 300, damping: 20 }}
             className="relative"
           >
             <VitaAvatar state="health" size={80} />
             <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0F172A]" />
           </motion.div>
           <motion.div
             initial={{ opacity: 0, x: -12 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.1 }}
           >
             <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-1">My Health Graph</h1>
             <p className="text-slate-400 text-sm">
               Your encrypted personal health record. All data stays on your device.
             </p>
           </motion.div>
         </header>
       </ScrollReveal>

       {/* OCR Section: Upload Lab Report */}
       <ScrollReveal delay={100}>
         <section className="glass-card p-5 rounded-2xl">
           <div className="flex items-center gap-2 mb-4">
             <FileText className="w-5 h-5 text-teal-400" />
             <h2 className="text-lg font-semibold text-slate-100">Explain Lab Results</h2>
           </div>
           <p className="text-sm text-slate-400 mb-4">
             Upload a photo or screenshot of your lab report. We'll extract the text and provide a plain-language explanation with color-coded status.
           </p>

           {ocrStatus === "idle" && !ocrImage && (
             <motion.button
               whileHover={{ scale: 1.01 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => fileInputRef.current?.click()}
               className="w-full py-8 border-2 border-dashed border-slate-600/50 rounded-2xl flex flex-col items-center gap-2 text-slate-400 hover:border-teal-500/50 hover:text-teal-300 transition-colors"
             >
               <Upload className="w-8 h-8" />
               <span className="text-sm font-medium">Tap to upload lab report image</span>
               <span className="text-xs text-slate-500">Supports JPG, PNG, PDF (via image)</span>
             </motion.button>
           )}

        {ocrStatus === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <MagnifyingLoader size={40} />
            <p className="text-slate-300 text-sm">Extracting text from image...</p>
            <p className="text-xs text-slate-500">This may take a few seconds</p>
          </div>
        )}

        {ocrStatus === "error" && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center">
            <p className="text-rose-300 text-sm mb-2">{ocrError}</p>
            <button onClick={clearOcr} className="text-xs text-teal-400 underline">Try again</button>
          </div>
        )}

        {ocrStatus === "done" && ocrImage && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <img src={ocrImage} alt="Lab report" className="w-32 h-32 object-cover rounded-xl border border-slate-700/50" />
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">Extracted text:</p>
                <pre className="text-sm text-slate-300 bg-slate-900/30 p-3 rounded-lg overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {ocrText || "(No text detected)"}
                </pre>
              </div>
            </div>

            {ocrExplanation && (
              <div>
                <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-teal-400" />
                  Vita AI Explanation
                </p>
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 text-sm text-slate-300 leading-relaxed">
                  {ocrExplanation}
                </div>
                <p className="text-xs text-slate-500 mt-2 italic">
                  AI-generated explanation for informational purposes only. Always verify with your healthcare provider.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={clearOcr}
              className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl text-sm transition-colors"
              >
                Clear & Start Over
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-xl text-sm transition-colors"
              >
                Upload Another
              </button>
            </div>
          </div>
        )}

         <input
           ref={fileInputRef}
           type="file"
           accept="image/*"
           onChange={handleFileChange}
           className="hidden"
         />
       </section>
       </ScrollReveal>

       {renderSection(
        "Conditions",
        <Heart className="w-5 h-5 text-rose-400" />,
        conditions,
        "No conditions recorded yet.",
        "Add Condition",
        "condition",
        (c: Condition) => (
          <div>
            <div className="font-medium text-slate-100">{c.name}</div>
            <div className="text-xs text-slate-400">Diagnosed: {c.diagnosedDate}</div>
            {c.notes && <div className="text-sm text-slate-300 mt-1">{c.notes}</div>}
          </div>
        )
      )}

      {renderSection(
        "Medications",
        <Pill className="w-5 h-5 text-emerald-400" />,
        medications,
        "No active medications.",
        "Add Medication",
        "medication",
        (m: Medication) => (
          <div>
            <div className="font-medium text-slate-100">{m.name} {m.dose}</div>
            <div className="text-xs text-slate-400">{m.frequency}</div>
            {m.endDate && <div className="text-xs text-slate-500 mt-1">Until {m.endDate}</div>}
          </div>
        )
      )}

      {renderSection(
        "Allergies",
        <AlertTriangle className="w-5 h-5 text-amber-400" />,
        allergies,
        "No allergies recorded.",
        "Add Allergy",
        "allergy",
        (a: Allergy) => (
          <div>
            <div className="font-medium text-slate-100">{a.substance}</div>
            <div className="text-xs text-slate-400">
              Reaction: {a.reaction} · Severity:{" "}
              <span className={`capitalize ${a.severity === "severe" ? "text-rose-400" : a.severity === "moderate" ? "text-amber-400" : "text-teal-400"}`}>
                {a.severity}
              </span>
            </div>
          </div>
        )
      )}

      {renderSection(
        "Encounters",
        <Calendar className="w-5 h-5 text-indigo-400" />,
        encounters,
        "No past encounters recorded.",
        "Add Encounter",
        "encounter",
        (e: Encounter) => (
          <div>
            <div className="font-medium text-slate-100">{e.facilityName}</div>
            <div className="text-xs text-slate-400">
              {e.date} · {e.reason}
            </div>
            {e.notes && <div className="text-sm text-slate-300 mt-1">{e.notes}</div>}
          </div>
        )
      )}

      {/* Modal for Condition */}
      <Modal isOpen={modalOpen === 'condition'} onClose={closeModal} title="Add Condition">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Condition Name</label>
            <input
              name="conditionName"
              value={formData.conditionName}
              onChange={handleInputChange}
              className="glass-input w-full rounded-2xl"
              placeholder="e.g., Type 2 Diabetes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Diagnosed Date</label>
            <input
              type="date"
              name="diagnosedDate"
              value={formData.diagnosedDate}
              onChange={handleInputChange}
              className="glass-input w-full rounded-2xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes (optional)</label>
            <textarea
              name="conditionNotes"
              value={formData.conditionNotes}
              onChange={handleInputChange}
              rows={3}
              className="glass-input w-full rounded-2xl resize-none"
            />
          </div>
          <div className="pt-2">
            <button onClick={handleAddCondition} className="w-full btn-primary rounded-2xl">
              Save Condition
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal for Medication */}
      <Modal isOpen={modalOpen === 'medication'} onClose={closeModal} title="Add Medication">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Medication Name</label>
            <input
              name="medicationName"
              value={formData.medicationName}
              onChange={handleInputChange}
              className="glass-input w-full rounded-2xl"
              placeholder="e.g., Metformin"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Dose</label>
              <input
                name="medicationDose"
                value={formData.medicationDose}
                onChange={handleInputChange}
                className="glass-input w-full rounded-2xl"
                placeholder="e.g., 500mg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Frequency</label>
              <input
                name="medicationFreq"
                value={formData.medicationFreq}
                onChange={handleInputChange}
                className="glass-input w-full rounded-2xl"
                placeholder="e.g., twice daily"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                name="medicationStart"
                value={formData.medicationStart}
                onChange={handleInputChange}
                className="glass-input w-full rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">End Date (optional)</label>
              <input
                type="date"
                name="medicationEnd"
                value={formData.medicationEnd}
                onChange={handleInputChange}
                className="glass-input w-full rounded-2xl"
              />
            </div>
          </div>
          <div className="pt-2">
            <button onClick={handleAddMedication} className="w-full btn-primary rounded-2xl">
              Add Medication
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal for Allergy */}
      <Modal isOpen={modalOpen === 'allergy'} onClose={closeModal} title="Add Allergy">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Substance</label>
            <input
              name="allergySubstance"
              value={formData.allergySubstance}
              onChange={handleInputChange}
              className="glass-input w-full rounded-2xl"
              placeholder="e.g., Penicillin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Reaction</label>
            <input
              name="allergyReaction"
              value={formData.allergyReaction}
              onChange={handleInputChange}
              className="glass-input w-full rounded-2xl"
              placeholder="e.g., Hives, difficulty breathing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Severity</label>
            <select
              name="allergySeverity"
              value={formData.allergySeverity}
              onChange={handleInputChange}
              className="glass-input w-full rounded-2xl"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <div className="pt-2">
            <button onClick={handleAddAllergy} className="w-full btn-primary rounded-2xl">
              Add Allergy
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal for Encounter */}
      <Modal isOpen={modalOpen === 'encounter'} onClose={closeModal} title="Add Encounter">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
            <input
              type="date"
              name="encounterDate"
              value={formData.encounterDate}
              onChange={handleInputChange}
              className="glass-input w-full rounded-2xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Facility Name</label>
            <input
              name="encounterFacility"
              value={formData.encounterFacility}
              onChange={handleInputChange}
              className="glass-input w-full rounded-2xl"
              placeholder="e.g., City General Hospital"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Reason for Visit</label>
            <input
              name="encounterReason"
              value={formData.encounterReason}
              onChange={handleInputChange}
              className="glass-input w-full rounded-2xl"
              placeholder="e.g., Annual checkup"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes (optional)</label>
            <textarea
              name="encounterNotes"
              value={formData.encounterNotes}
              onChange={handleInputChange}
              rows={3}
              className="glass-input w-full rounded-2xl resize-none"
            />
          </div>
          <div className="pt-2">
            <button onClick={handleAddEncounter} className="w-full btn-primary rounded-2xl">
              Add Encounter
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Modal component
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="glass-card w-full max-w-lg p-6 relative rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-700/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}