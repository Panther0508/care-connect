// src/pages/HealthGraph.tsx
// Personal Health Graph page – encrypted CRDT health records

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VitaAvatar from "../components/VitaAvatar";
import MagnifyingLoader from "../components/MagnifyingLoader";
import BarcodeScanner from "../components/BarcodeScanner";
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
import { ChevronRight, Heart, ScanBarcode, Pill, AlertTriangle, Calendar, Plus, X } from 'lucide-react';
import type { Condition, Medication, Allergy, Encounter } from "../lib/crdtHealthGraph";

type ModalType = 'condition' | 'medication' | 'allergy' | 'encounter' | null;

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
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <button
          onClick={() => openAddModal(modalType)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-2xl text-sm transition-all duration-200 hover:scale-103 active:scale-97 min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          {addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="glass-card p-6 text-center rounded-2xl">
          <p className="text-slate-400 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 rounded-xl relative group hover:border-teal-400/30 transition-all duration-200"
            >
              {renderItem(item)}
              <button
                onClick={() => handleDelete(modalType!, item.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-rose-400 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
                title="Delete"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
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
      <header className="flex items-center gap-4 md:gap-6">
        <div className="relative">
          <VitaAvatar state="health" size={80} />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0F172A]" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-1">My Health Graph</h1>
          <p className="text-slate-400 text-sm">
            Your encrypted personal health record. All data stays on your device.
          </p>
        </div>
      </header>

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="glass-card w-full max-w-lg p-6 relative rounded-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-700/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}