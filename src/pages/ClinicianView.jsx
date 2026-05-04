// src/pages/ClinicianView.jsx
// Clinician view — scans and displays a patient's Health Passport

import { useState } from 'react';
import QRScanner from '../components/QRScanner';
import { motion, AnimatePresence } from 'framer-motion';
import { storeHealthData, getHealthData } from '../lib/idb';

export default function ClinicianView() {
  const [scannedCredential, setScannedCredential] = useState(null);

  const handleScanSuccess = (validation) => {
    setScannedCredential(validation);
  };

  // Global VC scan handler for tests
  const handleVCScan = (credential) => {
    setScannedCredential(credential);
    // Store health data in IndexedDB for health graph
    if (credential?.claims?.healthSummary) {
      const stored = getHealthData() || { conditions: [], medications: [], allergies: [] };
      const summary = credential.claims.healthSummary;
      if (summary.conditions) {
        stored.conditions = [...stored.conditions, ...summary.conditions];
      }
      if (summary.medications) {
        stored.medications = [...stored.medications, ...summary.medications];
      }
      if (summary.allergies) {
        stored.allergies = [...stored.allergies, ...summary.allergies];
      }
      storeHealthData(stored);
    }
  };

  // Expose globally for cross-tab testing
  if (typeof window !== 'undefined') {
    window.handleVCScan = handleVCScan;
  }

  const handleReset = () => {
    setScannedCredential(null);
  };

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Clinician View</h1>
        <p className="text-slate-400 text-sm">
          Scan a patient's VitaChain Health Passport QR code to view their pre‑visit summary.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {!scannedCredential ? (
          <motion.div
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QRScanner onCredentialScanned={handleScanSuccess} onBack={() => {}} />
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            {/* Success Indicator */}
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Credential Verified</span>
            </div>

            {/* Patient Info */}
            <div className="glass-card p-5">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">Patient Health Summary</h3>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Specialist Type</div>
                  <div className="text-slate-200 capitalize">
                    {scannedCredential.claims.healthSummary?.specialist || 'General'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">AI‑Generated Summary</div>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {scannedCredential.claims.healthSummary?.summary || 'No summary available.'}
                  </div>
                </div>

                {/* Conditions */}
                {scannedCredential.claims.healthSummary?.conditions?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Conditions</div>
                    <div className="flex flex-wrap gap-2">
                      {scannedCredential.claims.healthSummary.conditions.map((c, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-700/30 rounded text-xs text-slate-300">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medications */}
                {scannedCredential.claims.healthSummary?.medications?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Medications</div>
                    <div className="space-y-1">
                      {scannedCredential.claims.healthSummary.medications.map((m, i) => (
                        <div key={i} className="text-sm text-slate-300">
                          {m.name} {m.dose} — {m.frequency}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergies */}
                {scannedCredential.claims.healthSummary?.allergies?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Allergies</div>
                    <div className="flex flex-wrap gap-2">
                      {scannedCredential.claims.healthSummary.allergies.map((a, i) => (
                        <span key={i} className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
                          {a.substance}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Encounter History */}
                {scannedCredential.claims.healthSummary?.encounters?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recent Encounters</div>
                    <div className="space-y-2">
                      {scannedCredential.claims.healthSummary.encounters.map((e, i) => (
                        <div key={i} className="text-sm text-slate-300 border-l-2 border-slate-700 pl-3">
                          <div>{e.facilityName}</div>
                          <div className="text-xs text-slate-500">{e.date} — {e.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verifier Info */}
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-slate-500">
                Issuer (Patient DID): <span className="font-mono text-slate-600">{scannedCredential.vc?.issuer}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="glass-card p-4 grid grid-cols-2 gap-3">
              <button onClick={handleReset} className="btn-secondary py-3">
                Scan Another
              </button>
              <button onClick={() => window.print()} className="btn-primary py-3">
                Print Summary
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
