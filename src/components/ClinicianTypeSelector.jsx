// src/components/ClinicianTypeSelector.jsx
// Grid of clinician type cards for passport creation

const CLINICIAN_TYPES = [
  { id: 'cardiologist', label: 'Cardiologist', icon: '/images/icons/healthicons/heart.svg', description: 'Heart specialist' },
  { id: 'pharmacist', label: 'Pharmacist', icon: '/images/icons/healthicons/pill.svg', description: 'Medication review' },
  { id: 'general', label: 'General Practitioner', icon: '/images/icons/healthicons/stethoscope.svg', description: 'Primary care' },
  { id: 'er', label: 'Emergency Medicine', icon: '/images/icons/healthicons/ambulance.svg', description: 'Emergency care' },
  { id: 'pediatrician', label: 'Pediatrician', icon: '/images/icons/healthicons/baby.svg', description: 'Child health' },
  { id: 'obstetrician', label: 'Obstetrician', icon: '/images/icons/healthicons/pregnant.svg', description: 'Pregnancy care' },
  { id: 'endocrinologist', label: ' Endocrinologist', icon: '/images/icons/healthicons/endocrine.svg', description: 'Hormone/metabolism' },
  { id: 'neurologist', label: 'Neurologist', icon: '/images/icons/healthicons/neurology.svg', description: 'Brain & nerves' },
];

export default function ClinicianTypeSelector({ onSelect }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Who is this for?</h2>
        <p className="text-slate-400 text-sm">Select the clinician type to tailor your pre‑visit summary.</p>
      </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CLINICIAN_TYPES.map((type) => (
           <button
             key={type.id}
             onClick={() => onSelect(type.id)}
               data-testid={type.id}
             className="p-4 rounded-xl border border-slate-700/30 bg-slate-800/40 hover:border-teal-500/50 hover:bg-slate-700/40 transition-all group text-left"
           >
             <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
               <img src={type.icon} alt="" className="w-8 h-8 drop-shadow" />
             </div>
             <div className="font-medium text-slate-100 text-sm">{type.label}</div>
             <div className="text-xs text-slate-500 mt-1 group-hover:text-slate-400">{type.description}</div>
           </button>
        ))}
      </div>
    </div>
  );
}
