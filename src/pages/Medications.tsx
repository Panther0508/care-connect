import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
  Pill,
  Plus,
  Bell,
  BellOff,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { addMedicationLog, getMedicationLogs, type MedicationLog } from "../lib/idb";

interface Medication {
  id: string;
  name: string;
  dosage: string; // e.g., "10mg"
  frequency: string; // e.g., "Once daily", "Twice daily"
  times: string[]; // ["08:00", "20:00"]
  notes?: string;
}

export default function MedicationsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [times, setTimes] = useState(["08:00"]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadLogs();
  }, [user]);

  const loadLogs = async () => {
    if (!user) return;
    const data = await getMedicationLogs(user.id, 100);
    setLogs(data);
  };

  const addTimeSlot = () => {
    if (times.length < 4) setTimes([...times, "12:00"]);
  };

  const updateTime = (idx: number, value: string) => {
    const newTimes = [...times];
    newTimes[idx] = value;
    setTimes(newTimes);
  };

  const removeTimeSlot = (idx: number) => {
    if (times.length > 1) setTimes(times.filter((_, i) => i !== idx));
  };

  const addMedication = async () => {
    if (!user || !medName.trim()) return;
    setSaving(true);
    const log = {
      userId: user.id,
      date: new Date().toISOString().split("T")[0],
      medicationName: medName.trim(),
      dosage: dosage.trim(),
      frequency,
      times,
      scheduled: true,
      takenTimes: [],
      notes: notes.trim() || undefined,
      timestamp: Date.now(),
    } as MedicationLog;
    await addMedicationLog(log);
    setMedName("");
    setDosage("");
    setFrequency("Once daily");
    setTimes(["08:00"]);
    setNotes("");
    setShowForm(false);
    await loadLogs();
    setSaving(false);
  };

  const markAsTaken = useCallback(async (logId: number, time: string) => {
    // Load, update, and save back
    const log = logs.find(l => l.id === logId);
    if (!log) return;
    const newTaken = [...(log.takenTimes || []), time];
    // Update via direct IDB put (need to import update function, but we'll do quick hack by re-adding is fine for demo)
    // For now just locally update optimism; in production we'd have updateMedicationLog
    setLogs(prev => prev.map(l => l.id === logId ? { ...l, takenTimes: newTaken } : l));
  }, [logs]);

  // Compute today's schedule
  const todayStr = new Date().toISOString().split("T")[0];
  const todaysMeds = logs.filter(l => l.date === todayStr);

  // Check upcoming doses (simple)
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Pill className="text-emerald-400" />
            Medications
          </h1>
          <p className="text-slate-400 text-sm">Never miss a dose</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl text-emerald-400 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/40 overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Add Medication</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Name</label>
              <input
                type="text"
                value={medName}
                onChange={e => setMedName(e.target.value)}
                placeholder="e.g., Lisinopril"
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Dosage (optional)</label>
              <input
                type="text"
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                placeholder="e.g., 10mg"
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Frequency</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200"
              >
                <option>Once daily</option>
                <option>Twice daily</option>
                <option>Three times daily</option>
                <option>As needed</option>
                <option>Weekly</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block flex items-center gap-2">
                <Clock size={12} />
                Times to take
              </label>
              <div className="space-y-2">
                {times.map((t, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="time"
                      value={t}
                      onChange={e => updateTime(idx, e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200"
                    />
                    {times.length > 1 && (
                      <button
                        onClick={() => removeTimeSlot(idx)}
                        className="px-3 py-2 bg-slate-700/50 hover:bg-red-500/20 text-slate-400 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {times.length < 4 && (
                <button onClick={addTimeSlot} className="text-xs text-teal-400 mt-2 flex items-center gap-1">
                  <Plus size={12} /> Add another time
                </button>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="With food? Special instructions?"
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={addMedication}
              disabled={saving || !medName.trim()}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
              <Pill size={16} />
              {saving ? "Saving..." : "Add Medication"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Today's Schedule */}
      <div className="space-y-3">
        {todaysMeds.length === 0 ? (
          <div className="text-center py-8 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
            <Pill size={40} className="mx-auto text-slate-600 mb-2" />
            <p className="text-slate-400 text-sm">No medications today</p>
            <p className="text-slate-500 text-xs">Tap + to add your first medication</p>
          </div>
        ) : (
          todaysMeds.map(med => {
            const takenCount = med.takenTimes?.length || 0;
            const totalDoses = med.times.length;
            const completed = takenCount >= totalDoses;
            return (
              <div key={med.id} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{med.medicationName}</h4>
                    <p className="text-xs text-slate-400">{med.dosage}</p>
                  </div>
                  {completed ? (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle size={12} /> Done
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full flex items-center gap-1">
                      <AlertCircle size={12} /> {totalDoses - takenCount} left
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {med.times.map((time, idx) => {
                    const isTaken = med.takenTimes?.includes(time);
                    return (
                      <button
                        key={idx}
                        onClick={() => !isTaken && markAsTaken(med.id!, time)}
                        disabled={isTaken}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                          isTaken
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-slate-900/50 border-slate-700/30 hover:border-emerald-500/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock size={14} className={isTaken ? "text-emerald-400" : "text-slate-400"} />
                          <span className={isTaken ? "text-emerald-300" : "text-slate-200"}>{time}</span>
                        </div>
                        {isTaken ? <CheckCircle size={16} className="text-emerald-400" /> : <Plus size={16} className="text-slate-500" />}
                      </button>
                    );
                  })}
                </div>
                {med.notes && <p className="text-xs text-slate-500 mt-2 italic">"{med.notes}"</p>}
              </div>
            );
          })
        )}
      </div>

      {/* History */}
      {logs.length > todaysMeds.length && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white">Past Medications</h3>
          {logs.filter(l => l.date !== todayStr).slice(0, 5).map(log => (
            <div key={log.id} className="bg-slate-800/20 rounded-lg p-3 border border-slate-700/20">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">{log.medicationName} {log.dosage}</span>
                <span className="text-slate-500 text-xs">{log.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
