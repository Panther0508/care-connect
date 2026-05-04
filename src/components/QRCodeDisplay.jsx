// src/components/QRCodeDisplay.jsx
// Renders QR code image and export options

import { motion } from "framer-motion";

export default function QRCodeDisplay({ qrDataURL, credential, onDone, onScanAnother }) {
  // Download QR as PNG
  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `vitachain-passport-${credential.credentialSubject.healthSummary.specialist}.png`;
    link.href = qrDataURL;
    link.click();
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Your Health Passport</h2>
        <p className="text-slate-400 text-sm">
          Show this QR code to the clinician. They can scan it to view your pre‑visit summary.
        </p>
      </div>

      {/* QR Code */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex justify-center"
      >
        <div className="p-4 bg-white rounded-2xl shadow-lg">
          <img src={qrDataURL} alt="Health Passport QR Code" className="max-w-full w-auto h-auto max-w-[280px] qr-code" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      </motion.div>

      {/* Credential Details */}
      <div className="glass-card p-4 text-xs text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>Issued:</span>
          <span className="text-slate-300">{new Date(credential.issuanceDate).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Issuer (You):</span>
          <span className="text-slate-300 font-mono truncate max-w-[200px]">{credential.issuer}</span>
        </div>
        <div className="flex justify-between">
          <span>Type:</span>
          <span className="text-slate-300">{credential.credentialSubject.healthSummary.specialist}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="text-emerald-400">Valid for this encounter</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleDownload} className="btn-secondary py-3 text-sm">
          Export as Image
        </button>
        <button onClick={onScanAnother} className="btn-secondary py-3 text-sm">
          Scan Another
        </button>
      </div>

      <button onClick={onDone} className="w-full btn-primary py-3">
        Done
      </button>
    </div>
  );
}
