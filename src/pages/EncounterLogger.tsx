import { useState } from "react";
import { motion } from "framer-motion";
import { useStatus } from "../hooks/useStatus";
import { User, MapPin, Clock, Thermometer, Scale, Heart, Activity, ChevronRight, Save } from "lucide-react";

interface EncounterLog {
  patientId: string;
  patientName: string;
  vitals: {
    bpSystolic: number;
    bpDiastolic: number;
    temperature: number;
    weight: number;
    heartRate: number;
  };
  symptoms: string[];
  treatment: string;
  referral: string;
  notes: string;
  timestamp: number;
}

export default function EncounterLogger() {
  const { showStatus } = useStatus();
  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    bpSystolic: "",
    bpDiastolic: "",
    temperature: "",
    weight: "",
    heartRate: "",
    symptoms: "",
    treatment: "",
    referral: "",
    notes: "",
  });
  const [saved, setSaved] = useState<EncounterLog[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.patientName || !form.bpSystolic || !form.bpDiastolic) {
      showStatus("error", "Missing Fields", "Patient name and blood pressure are required.");
      return;
    }

    const encounter: EncounterLog = {
      patientId: form.patientId || Date.now().toString(),
      patientName: form.patientName,
      vitals: {
        bpSystolic: parseInt(form.bpSystolic),
        bpDiastolic: parseInt(form.bpDiastolic),
        temperature: parseFloat(form.temperature) || 0,
        weight: parseFloat(form.weight) || 0,
        heartRate: parseInt(form.heartRate) || 0,
      },
      symptoms: form.symptoms.split(",").map(s => s.trim()).filter(Boolean),
      treatment: form.treatment,
      referral: form.referral,
      notes: form.notes,
      timestamp: Date.now(),
    };

    // In production: save to IndexedDB
    setSaved(prev => [encounter, ...prev]);
    showStatus("success", "Encounter Saved", `Recorded visit for ${form.patientName}`);

    // Reset form
    setForm({
      patientId: "",
      patientName: "",
      bpSystolic: "",
      bpDiastolic: "",
      temperature: "",
      weight: "",
      heartRate: "",
      symptoms: "",
      treatment: "",
      referral: "",
      notes: "",
    });
  };

  const getBPCategory = (sys: number, dia: number) => {
    if (sys >= 180 || dia >= 120) return { label: "Crisis", color: "text-rose-400" };
    if (sys >= 140 || dia >= 90) return { label: "Stage 2", color: "text-amber-400" };
    if (sys >= 130 || dia >= 80) return { label: "Stage 1", color: "text-amber-300" };
    return { label: "Normal", color: "text-emerald-400" };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Encounter Logger</h1>
        <p className="text-slate-400 text-sm">Record home visit data quickly</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input form */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4">New Encounter</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Patient ID (optional)</label>
                <input
                  name="patientId"
                  value={form.patientId}
                  onChange={handleChange}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Patient Name *</label>
                <input
                  name="patientName"
                  value={form.patientName}
                  onChange={handleChange}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                  placeholder="Full name"
                />
              </div>
            </div>

            {/* Vitals block */}
            <div className="bg-slate-900/30 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-white text-sm flex items-center gap-2">
                <Activity className="text-teal-400" size={16} />
                Vitals
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">BP (systolic)</label>
                  <input
                    name="bpSystolic"
                    type="number"
                    value={form.bpSystolic}
                    onChange={handleChange}
                    className="glass-input w-full px-3 py-2 text-sm"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">BP (diastolic)</label>
                  <input
                    name="bpDiastolic"
                    type="number"
                    value={form.bpDiastolic}
                    onChange={handleChange}
                    className="glass-input w-full px-3 py-2 text-sm"
                    placeholder="80"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Heart rate</label>
                  <input
                    name="heartRate"
                    type="number"
                    value={form.heartRate}
                    onChange={handleChange}
                    className="glass-input w-full px-3 py-2 text-sm"
                    placeholder="72"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Temp (°C)</label>
                  <input
                    name="temperature"
                    type="number"
                    step="0.1"
                    value={form.temperature}
                    onChange={handleChange}
                    className="glass-input w-full px-3 py-2 text-sm"
                    placeholder="36.6"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Weight (kg)</label>
                  <input
                    name="weight"
                    type="number"
                    step="0.1"
                    value={form.weight}
                    onChange={handleChange}
                    className="glass-input w-full px-3 py-2 text-sm"
                    placeholder="70"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Symptoms (comma-separated)</label>
              <input
                name="symptoms"
                value={form.symptoms}
                onChange={handleChange}
                className="glass-input w-full px-3 py-2.5 text-sm"
                placeholder="fever, cough, headache"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Treatment Given</label>
              <textarea
                name="treatment"
                value={form.treatment}
                onChange={handleChange}
                rows={2}
                className="glass-input w-full px-3 py-2.5 text-sm resize-none"
                placeholder="Medications, procedures..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Referral (if any)</label>
              <input
                name="referral"
                value={form.referral}
                onChange={handleChange}
                className="glass-input w-full px-3 py-2.5 text-sm"
                placeholder="Specialist, facility..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                className="glass-input w-full px-3 py-2.5 text-sm resize-none"
                placeholder="Additional observations..."
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Encounter
            </button>
          </form>
        </div>

        {/* Recent encounters */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Recent Encounters</h2>
          {saved.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-400 text-sm">
              No encounters logged yet.
            </div>
          ) : (
            saved.map((enc) => {
              const bp = getBPCategory(enc.vitals.bpSystolic, enc.vitals.bpDiastolic);
              return (
                <div key={enc.timestamp} className="glass-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-white">{enc.patientName}</h3>
                      <p className="text-xs text-slate-400">{new Date(enc.timestamp).toLocaleString()}</p>
                    </div>
                    <div className={`text-sm font-medium ${bp.color}`}>
                      {enc.vitals.bpSystolic}/{enc.vitals.bpDiastolic}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Thermometer size={12} /> {enc.vitals.temperature}°C</span>
                    <span className="flex items-center gap-1"><Scale size={12} /> {enc.vitals.weight}kg</span>
                    <span className="flex items-center gap-1"><Heart size={12} /> {enc.vitals.heartRate}bpm</span>
                  </div>
                  {enc.symptoms.length > 0 && (
                    <p className="text-xs text-slate-400 mt-2">
                      <strong>Symptoms:</strong> {enc.symptoms.join(", ")}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
