import { motion } from "framer-motion";
import { QrCode, Download, Share2, Shield, FileText, AlertTriangle } from "lucide-react";

export default function Passport() {
  const mockHealthData = {
    conditions: ["Hypertension", "Type 2 Diabetes"],
    medications: ["Metformin 500mg twice daily", "Lisinopril 10mg daily"],
    allergies: ["Penicillin"],
    lastCheckup: "2025-12-15",
    bloodType: "O+",
  };

  const handleDownload = () => {
    // Generate and download verifiable credential JSON
    const vc = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential", "VitaHealthSummary"],
      issuer: "did:vitachain:admin",
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: "did:patient:self",
        healthSummary: mockHealthData,
      },
    };
    const blob = new Blob([JSON.stringify(vc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vitapassport-credential.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "My VitaPassport",
        text: "Scan to view my health summary",
        url: window.location.origin + "/passport?share=me",
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + "/passport?share=me");
    }
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
            <h1 className="text-2xl font-bold text-white mb-1">VitaPassport</h1>
            <p className="text-slate-400 text-sm">Your portable health summary</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/30 text-slate-300 transition-all"
              title="Download VC"
            >
              <Download size={18} />
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/30 text-slate-300 transition-all"
              title="Share"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* QR Code card */}
        <div className="glass-card p-6 text-center mb-6">
          <div className="inline-flex items-center justify-center w-48 h-48 bg-white rounded-xl mb-4">
            <QrCode size={180} className="text-slate-900" />
          </div>
          <p className="text-slate-400 text-xs">
            Scan this QR code to share your health summary with healthcare providers.
            <br />
            <span className="text-amber-400 flex items-center justify-center gap-1 mt-2">
              <AlertTriangle size={12} />
              Share only with trusted medical professionals
            </span>
          </p>
        </div>

        {/* Health summary card */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-teal-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Health Summary</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {mockHealthData.conditions.map((cond, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-sm border border-rose-500/20">
                    {cond}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Medications</h3>
              <ul className="space-y-1">
                {mockHealthData.medications.map((med, idx) => (
                  <li key={idx} className="text-slate-300 text-sm flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-teal-400" />
                    {med}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Allergies</h3>
              <div className="flex flex-wrap gap-2">
                {mockHealthData.allergies.map((allergy, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-sm border border-amber-500/20">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div>
                <p className="text-xs text-slate-400">Blood Type</p>
                <p className="font-semibold text-white">{mockHealthData.bloodType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Last Checkup</p>
                <p className="font-semibold text-white">
                  {new Date(mockHealthData.lastCheckup).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex gap-3">
            <Shield className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-slate-300">
              <p className="font-medium text-amber-300 mb-1">Security Notice</p>
              <p>
                Your QR code contains encrypted health data. Only share it with trusted healthcare providers.
                You can revoke access at any time from Settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
