import { useState } from 'react';
import { motion } from 'framer-motion';

interface Condition {
  id: string;
  name: string;
  diagnosedDate: string;
  notes: string;
}

interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  startDate: string;
}

interface Allergy {
  id: string;
  substance: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

interface StepHealthProfileProps {
  onNext: () => void;
  onBack: () => void;
  profile: {
    conditions: Condition[];
    medications: Medication[];
    allergies: Allergy[];
  };
  onUpdate: (updates: any) => void;
}

const COMMON_CONDITIONS = [
  'Hypertension', 'Diabetes Type 2', 'Asthma', 'Arthritis', 'Depression',
  'Anxiety', 'Heart Disease', 'COPD', 'Thyroid Disorder', 'Migraine',
  'Epilepsy', 'Cancer', 'Stroke', 'Osteoporosis', 'Glaucoma'
];

const COMMON_MEDICATIONS = [
  'Aspirin', 'Metformin', 'Lisinopril', 'Atorvastatin', 'Levothyroxine',
  'Albuterol', 'Omeprazole', 'Amlodipine', 'Metoprolol', 'Sertraline',
  'Ibuprofen', 'Amoxicillin', 'Prednisone', 'Alprazolam', 'Gabapentin'
];

export default function StepHealthProfile({ onNext, onBack, profile, onUpdate }: StepHealthProfileProps) {
  // Form state for adding new entries
  const [newCondition, setNewCondition] = useState<Omit<Condition, 'id'>>({
    name: '', diagnosedDate: '', notes: ''
  });
  const [newMed, setNewMed] = useState<Omit<Medication, 'id'>>({
    name: '', dose: '', frequency: '', startDate: ''
  });
  const [newAllergy, setNewAllergy] = useState<Omit<Allergy, 'id'>>({
    substance: '', reaction: '', severity: 'mild'
  });

  // Add methods
  const addCondition = () => {
    if (!newCondition.name.trim()) return;
    const condition: Condition = {
      ...newCondition,
      id: crypto.randomUUID(),
    };
    onUpdate({
      healthProfile: {
        ...profile,
        conditions: [...profile.conditions, condition],
      },
    });
    setNewCondition({ name: '', diagnosedDate: '', notes: '' });
  };

  const addMedication = () => {
    if (!newMed.name.trim()) return;
    const medication: Medication = {
      ...newMed,
      id: crypto.randomUUID(),
    };
    onUpdate({
      healthProfile: {
        ...profile,
        medications: [...profile.medications, medication],
      },
    });
    setNewMed({ name: '', dose: '', frequency: '', startDate: '' });
  };

  const addAllergy = () => {
    if (!newAllergy.substance.trim()) return;
    const allergy: Allergy = {
      ...newAllergy,
      id: crypto.randomUUID(),
    };
    onUpdate({
      healthProfile: {
        ...profile,
        allergies: [...profile.allergies, allergy],
      },
    });
    setNewAllergy({ substance: '', reaction: '', severity: 'mild' });
  };

  // Remove methods
  const removeCondition = (id: string) => {
    onUpdate({
      healthProfile: {
        ...profile,
        conditions: profile.conditions.filter(c => c.id !== id),
      },
    });
  };

  const removeMedication = (id: string) => {
    onUpdate({
      healthProfile: {
        ...profile,
        medications: profile.medications.filter(m => m.id !== id),
      },
    });
  };

  const removeAllergy = (id: string) => {
    onUpdate({
      healthProfile: {
        ...profile,
        allergies: profile.allergies.filter(a => a.id !== id),
      },
    });
  };

  // Check if can proceed (at least one entry in each section is optional? For now require at least 1 condition or medication or allergy)
  const canProceed = profile.conditions.length > 0 || profile.medications.length > 0 || profile.allergies.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your Health Profile</h2>
        <p className="text-slate-400">
          Add your health information. This helps the AI provide accurate insights. You can add as many entries as you need.
        </p>
      </div>

      {/* Conditions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Conditions</h3>
          <span className="text-sm text-slate-400">{profile.conditions.length} added</span>
        </div>

        {/* Existing conditions as cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.conditions.map((cond) => (
            <div
              key={cond.id}
              className="group relative bg-slate-800/50 border border-slate-600 rounded-xl p-4 hover:border-teal-500/50 transition-all"
            >
              <button
                onClick={() => removeCondition(cond.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all"
                aria-label="Remove condition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="font-semibold text-teal-300">{cond.name}</div>
              {cond.diagnosedDate && (
                <div className="text-xs text-slate-400 mt-1">
                  Diagnosed: {new Date(cond.diagnosedDate).toLocaleDateString()}
                </div>
              )}
              {cond.notes && (
                <div className="text-sm text-slate-300 mt-2">{cond.notes}</div>
              )}
            </div>
          ))}
        </div>

        {/* Add condition form */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="font-medium text-sm text-teal-300">+ Add Condition</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Condition name *</label>
              <input
                type="text"
                value={newCondition.name}
                onChange={(e) => setNewCondition({ ...newCondition, name: e.target.value })}
                placeholder="e.g., Hypertension"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date diagnosed</label>
              <input
                type="date"
                value={newCondition.diagnosedDate}
                onChange={(e) => setNewCondition({ ...newCondition, diagnosedDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <input
              type="text"
              value={newCondition.notes}
              onChange={(e) => setNewCondition({ ...newCondition, notes: e.target.value })}
              placeholder="Optional: additional details"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            onClick={addCondition}
            disabled={!newCondition.name.trim()}
            className="w-full py-2 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/50 text-teal-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Condition
          </button>
        </div>
      </section>

      {/* Medications Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Medications</h3>
          <span className="text-sm text-slate-400">{profile.medications.length} added</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {profile.medications.map((med) => (
            <div
              key={med.id}
              className="group relative bg-slate-800/50 border border-slate-600 rounded-xl p-4 hover:border-teal-500/50 transition-all"
            >
              <button
                onClick={() => removeMedication(med.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all"
                aria-label="Remove medication"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="font-semibold text-teal-300">{med.name}</div>
              {med.dose && <div className="text-sm text-slate-300">Dose: {med.dose}</div>}
              {med.frequency && <div className="text-sm text-slate-300">Frequency: {med.frequency}</div>}
              {med.startDate && (
                <div className="text-xs text-slate-400 mt-1">
                  Started: {new Date(med.startDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="font-medium text-sm text-teal-300">+ Add Medication</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Medication name *</label>
              <input
                type="text"
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                placeholder="e.g., Lisinopril"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Dose</label>
              <input
                type="text"
                value={newMed.dose}
                onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                placeholder="e.g., 10mg"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Frequency</label>
              <input
                type="text"
                value={newMed.frequency}
                onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                placeholder="e.g., Once daily"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start date</label>
              <input
                type="date"
                value={newMed.startDate}
                onChange={(e) => setNewMed({ ...newMed, startDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <button
            onClick={addMedication}
            disabled={!newMed.name.trim()}
            className="w-full py-2 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/50 text-teal-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Medication
          </button>
        </div>
      </section>

      {/* Allergies Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Allergies</h3>
          <span className="text-sm text-slate-400">{profile.allergies.length} added</span>
        </div>

        <div className="grid gap-3">
          {profile.allergies.map((allergy) => (
            <div
              key={allergy.id}
              className="group relative bg-slate-800/50 border border-slate-600 rounded-xl p-4 hover:border-teal-500/50 transition-all"
            >
              <button
                onClick={() => removeAllergy(allergy.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all"
                aria-label="Remove allergy"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="font-semibold text-teal-300">{allergy.substance}</div>
              <div className="text-sm text-slate-300">Reaction: {allergy.reaction}</div>
              <div className="text-xs text-slate-400 mt-1">
                Severity: <span className="capitalize">{allergy.severity}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="font-medium text-sm text-teal-300">+ Add Allergy</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Allergen *</label>
              <input
                type="text"
                value={newAllergy.substance}
                onChange={(e) => setNewAllergy({ ...newAllergy, substance: e.target.value })}
                placeholder="e.g., Penicillin"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Reaction *</label>
              <input
                type="text"
                value={newAllergy.reaction}
                onChange={(e) => setNewAllergy({ ...newAllergy, reaction: e.target.value })}
                placeholder="e.g., Rash, swelling"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Severity</label>
              <select
                value={newAllergy.severity}
                onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>
          <button
            onClick={addAllergy}
            disabled={!newAllergy.substance.trim() || !newAllergy.reaction.trim()}
            className="w-full py-2 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/50 text-teal-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Allergy
          </button>
        </div>
      </section>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 py-3 bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-teal-500 transition-colors font-semibold"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
