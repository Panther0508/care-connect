import { useState } from 'react';
import { motion } from 'framer-motion';

interface StepHealthProfileProps {
  onNext: () => void;
  onBack: () => void;
  profile: {
    conditions: string[];
    medications: string[];
    allergies: string[];
  };
  onUpdate: (updates: any) => void;
}

const commonConditions = [
  'Hypertension', 'Diabetes Type 2', 'Asthma', 'Arthritis', 'Depression',
  'Anxiety', 'Heart Disease', 'COPD', 'Thyroid Disorder', 'Migraine',
];

const commonMedications = [
  'Aspirin', 'Metformin', 'Lisinopril', 'Atorvastatin', 'Levothyroxine',
  'Albuterol', 'Omeprazole', 'Amlodipine', 'Metoprolol', 'Sertraline',
];

const commonAllergies = [
  'Penicillin', 'Sulfa Drugs', 'Peanuts', 'Tree Nuts', 'Shellfish',
  'Latex', 'Eggs', 'Milk', 'Wheat', 'Dust Mites',
];

export default function StepHealthProfile({ onNext, onBack, profile, onUpdate }: StepHealthProfileProps) {
  const [newCondition, setNewCondition] = useState('');
  const [newMed, setNewMed] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  const addItem = (type: 'conditions' | 'medications' | 'allergies', value: string) => {
    if (value && !profile[type].includes(value)) {
      onUpdate({
        healthProfile: {
          ...profile,
          [type]: [...profile[type], value],
        },
      });
    }
  };

  const removeItem = (type: 'conditions' | 'medications' | 'allergies', value: string) => {
    onUpdate({
      healthProfile: {
        ...profile,
        [type]: profile[type].filter((item) => item !== value),
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your Health Profile</h2>
        <p className="text-slate-400">
          Add your current health information. This helps the AI provide accurate insights.
        </p>
      </div>

      {/* Conditions */}
      <div>
        <label className="block text-sm font-medium mb-2">Chronic Conditions</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {commonConditions.map((cond) => (
            <button
              key={cond}
              onClick={() => addItem('conditions', cond)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                profile.conditions.includes(cond)
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem('conditions', newCondition) && setNewCondition('')}
            placeholder="Add custom condition..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={() => addItem('conditions', newCondition) && setNewCondition('')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
        {profile.conditions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.conditions.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-sm">
                {c}
                <button onClick={() => removeItem('conditions', c)} className="text-slate-400 hover:text-white">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Medications */}
      <div>
        <label className="block text-sm font-medium mb-2">Current Medications</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {commonMedications.map((med) => (
            <button
              key={med}
              onClick={() => addItem('medications', med)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                profile.medications.includes(med)
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {med}
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium mb-2">Allergies</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {commonAllergies.map((allergy) => (
            <button
              key={allergy}
              onClick={() => addItem('allergies', allergy)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                profile.allergies.includes(allergy)
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {allergy}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors font-semibold"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
