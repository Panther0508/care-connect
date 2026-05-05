import { motion } from "framer-motion";
import { FileText, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getCurrentHealthState } from "../services/healthGraph";

export default function PatientHistory() {
  const health = getCurrentHealthState();

  const getTrendIcon = (status?: string) => {
    if (!status) return <Minus className="text-slate-400" size={16} />;
    if (status === "improving") return <TrendingUp className="text-emerald-400" size={16} />;
    if (status === "worsening") return <TrendingDown className="text-rose-400" size={16} />;
    return <Minus className="text-amber-400" size={16} />;
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(health, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patient-history.json";
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Patient History</h1>
            <p className="text-slate-400 text-sm">Complete medical timeline</p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700/30 text-slate-200 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <Download size={16} />
            Export JSON
          </button>
        </div>

        <div className="space-y-6">
          {/* Conditions section */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-rose-400" size={20} />
              <h2 className="text-lg font-semibold text-white">Conditions</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 text-xs">
                {health.conditions?.length || 0}
              </span>
            </div>

            {!health.conditions?.length ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No conditions recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {health.conditions?.map((cond: any) => (
                  <div
                    key={cond.id}
                    className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-white">{cond.name}</h3>
                        <p className="text-xs text-slate-400">
                          Diagnosed: {new Date(cond.diagnosedDate).toLocaleDateString()}
                        </p>
                      </div>
                      {getTrendIcon(cond.status)}
                    </div>
                    {cond.notes && (
                      <p className="text-sm text-slate-300 mt-2">{cond.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medications history */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💊</span>
              <h2 className="text-lg font-semibold text-white">Medications</h2>
            </div>
            {!health.medications?.length ? (
              <div className="text-center py-8 text-slate-500 text-sm">No medications recorded.</div>
            ) : (
              <div className="space-y-3">
                {health.medications?.map((med: any) => (
                  <div key={med.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <h3 className="font-medium text-white">{med.name} {med.dose}</h3>
                    <p className="text-sm text-slate-400 mt-1">Frequency: {med.frequency}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Started: {new Date(med.startDate).toLocaleDateString()}
                      {med.endDate && ` · Ended: ${new Date(med.endDate).toLocaleDateString()}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Allergies */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-lg font-semibold text-white">Allergies</h2>
            </div>
            {!health.allergies?.length ? (
              <div className="text-center py-8 text-slate-500 text-sm">No allergies recorded.</div>
            ) : (
              <div className="space-y-3">
                {health.allergies?.map((allergy: any) => (
                  <div key={allergy.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <h3 className="font-medium text-white">{allergy.substance}</h3>
                    <p className="text-sm text-slate-400 mt-1">Reaction: {allergy.reaction}</p>
                    <p className="text-xs text-slate-500 mt-1 capitalize">
                      Severity: {allergy.severity}
                      {allergy.severity === "severe" && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs">Severe</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Encounter history */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📅</span>
              <h2 className="text-lg font-semibold text-white">Encounter History</h2>
            </div>
            {!health.encounters?.length ? (
              <div className="text-center py-8 text-slate-500 text-sm">No past encounters recorded.</div>
            ) : (
              <div className="space-y-3">
                {[...(health.encounters || [])]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((enc: any) => (
                    <div key={enc.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-white">{enc.facilityName}</h3>
                          <p className="text-sm text-slate-400">{enc.reason}</p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(enc.date).toLocaleDateString()}
                        </span>
                      </div>
                      {enc.notes && (
                        <p className="text-sm text-slate-300 mt-2">{enc.notes}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
