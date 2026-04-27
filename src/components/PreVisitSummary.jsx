// src/components/PreVisitSummary.jsx
// Displays AI-generated pre-visit summary before QR sharing

import { motion } from "framer-motion";

export default function PreVisitSummary({ specialist, summaryText, healthData, onConfirm, onBack }) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Pre‑Visit Summary</h2>
        <p className="text-slate-400 text-sm">
          Review the information that will be shared with the {specialist}.
        </p>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 border-l-4 border-teal-500"
      >
        <h3 className="text-lg font-semibold text-slate-100 mb-3">AI‑Generated Summary</h3>
        <div className="prose prose-invert max-w-none text-slate-300 text-sm whitespace-pre-line">
          {summaryText}
        </div>
      </motion.div>

      {/* Health Data Preview */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">What's Included</h3>

        {healthData.conditions.length > 0 && (
          <div className="glass-card p-3">
            <div className="text-xs text-slate-500 mb-1">Conditions</div>
            <div className="text-sm text-slate-300">
              {healthData.conditions.map(c => c.name).join(', ')}
            </div>
          </div>
        )}

        {healthData.medications.length > 0 && (
          <div className="glass-card p-3">
            <div className="text-xs text-slate-500 mb-1">Medications</div>
            <div className="text-sm text-slate-300">
              {healthData.medications.map(m => `${m.name} ${m.dose}`).join(', ')}
            </div>
          </div>
        )}

        {healthData.allergies.length > 0 && (
          <div className="glass-card p-3">
            <div className="text-xs text-slate-500 mb-1">Allergies</div>
            <div className="text-sm text-slate-300">
              {healthData.allergies.map(a => a.substance).join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200">
        This QR code contains your health information. Only share it with trusted healthcare providers.
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 btn-secondary">
          Back
        </button>
        <button onClick={onConfirm} className="flex-1 btn-primary">
          Generate QR Code
        </button>
      </div>
    </div>
  );
}
