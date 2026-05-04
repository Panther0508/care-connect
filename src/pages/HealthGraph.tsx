// src/pages/HealthGraph.tsx
// Personal Health Graph page – encrypted CRDT health records

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VitaAvatar from "../components/VitaAvatar";
import MagnifyingLoader from "../components/MagnifyingLoader";
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
import type { Condition, Medication, Allergy, Encounter } from "../lib/crdtHealthGraph";

export default function HealthGraph() {
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

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: any[],
    emptyMessage: string,
    addLabel: string,
    modalType: ModalType,
    renderItem: (item: any) => React.ReactNode
  ) => (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <button
          onClick={() => openAddModal(modalType)}
          className="flex items-center gap-1 px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-slate-500 text-sm italic">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3 relative group hover:border-slate-600/50 transition-colors"
            >
              {renderItem(item)}
              <button
                onClick={() => handleDelete(modalType!, item.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

   if (loading) {
     return (
       <div className="flex items-center justify-center py-20">
         <MagnifyingLoader size={32} />
       </div>
     );
   }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-6">
        <VitaAvatar state="health" size={100} />
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">My Health Graph</h1>
          <p className="text-slate-400 text-sm">
            Your encrypted personal health record. All data stays on your device.
          </p>
        </div>
      </header>

      {renderSection(
        "Conditions",
        <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>,
        conditions,
        "No conditions recorded.",
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
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>,
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
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>,
        allergies,
        "No allergies recorded.",
        "Add Allergy",
        "allergy",
        (a: Allergy) => (
          <div>
            <div className="font-medium text-slate-100">{a.substance}</div>
            <div className="text-xs text-slate-400">
              Reaction: {a.reaction} · Severity:{" "}
              <span className={`capitalize ${a.severity === "severe" ? "text-red-400" : a.severity === "moderate" ? "text-amber-400" : "text-blue-400"}`}>
                {a.severity}
              </span>
            </div>
          </div>
        )
      )}

      {renderSection(
        "Encounters",
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>,
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
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
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
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes (optional)</label>
            <textarea
              name="conditionNotes"
              value={formData.conditionNotes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400 resize-none"
            />
          </div>
          <div className="pt-2">
            <button onClick={handleAddCondition} className="w-full btn-primary">
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
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
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
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
                placeholder="e.g., 500mg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Frequency</label>
              <input
                name="medicationFreq"
                value={formData.medicationFreq}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
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
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">End Date (optional)</label>
              <input
                type="date"
                name="medicationEnd"
                value={formData.medicationEnd}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
              />
            </div>
          </div>
          <div className="pt-2">
            <button onClick={handleAddMedication} className="w-full btn-primary">
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
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
              placeholder="e.g., Penicillin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Reaction</label>
            <input
              name="allergyReaction"
              value={formData.allergyReaction}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
              placeholder="e.g., Hives, difficulty breathing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Severity</label>
            <select
              name="allergySeverity"
              value={formData.allergySeverity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <div className="pt-2">
            <button onClick={handleAddAllergy} className="w-full btn-primary">
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
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Facility Name</label>
            <input
              name="encounterFacility"
              value={formData.encounterFacility}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
              placeholder="e.g., City General Hospital"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Reason for Visit</label>
            <input
              name="encounterReason"
              value={formData.encounterReason}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
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
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400 resize-none"
            />
          </div>
          <div className="pt-2">
            <button onClick={handleAddEncounter} className="w-full btn-primary">
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg p-6 relative"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
