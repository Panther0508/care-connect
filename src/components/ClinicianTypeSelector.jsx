// src/components/ClinicianTypeSelector.jsx
// Grid of clinician type cards for passport creation

const CLINICIAN_TYPES = [
  { id: 'cardiologist', label: 'Cardiologist', icon: '❤️', description: 'Heart specialist' },
  { id: 'pharmacist', label: 'Pharmacist', icon: '💊', description: 'Medication review' },
  { id: 'general', label: 'General Practitioner', icon: '🩺', description: 'Primary care' },
  { id: 'er', label: 'Emergency Medicine', icon: '🚑', description: 'Emergency care' },
  { id: 'pediatrician', label: 'Pediatrician', icon: '👶', description: 'Child health' },
  { id: 'obstetrician', label: 'Obstetrician', icon: '🤰', description: 'Pregnancy care' },
  { id: 'endocrinologist', label: 'Endocrinologist', icon: '🦋', description: 'Hormone/metabolism' },
  { id: 'neurologist', label: 'Neurologist', icon: '🧠', description: 'Brain & nerves' },
];

export default function ClinicianTypeSelector({ onSelect }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Who is this for?</h2>
        <p className="text-slate-400 text-sm">Select the clinician type to tailor your pre‑visit summary.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CLINICIAN_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className="p-4 rounded-xl border border-slate-700/30 bg-slate-800/40 hover:border-teal-500/50 hover:bg-slate-700/40 transition-all group text-left"
          >
            <div className="text-3xl mb-2">{type.icon}</div>
            <div className="font-medium text-slate-100 text-sm">{type.label}</div>
            <div className="text-xs text-slate-500 mt-1 group-hover:text-slate-400">{type.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
