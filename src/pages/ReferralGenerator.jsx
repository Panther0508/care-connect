import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Send, CheckCircle } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import QRCode from "qrcode";
import { storeReferral } from "../lib/idb";
import QRCodeDisplay from "../components/QRCodeDisplay";

export default function ReferralGenerator() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    patientName: "",
    specialistType: "Cardiologist",
    reason: "",
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientName.trim() || !form.reason.trim()) return;
    setGenerating(true);
    try {
      // Store referral in IndexedDB
      const referralId = await storeReferral({
        patientName: form.patientName,
        specialistType: form.specialistType,
        reason: form.reason,
        status: "pending",
        createdAt: Date.now(),
        clinicianId: user?.id,
      });

      // Build a minimal Verifiable Credential
      const vc = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "VitaReferral"],
        issuer: user?.id || "clinician:unknown",
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `did:vitachain:referral/${referralId}`,
          referral: {
            id: referralId,
            patientName: form.patientName,
            specialistType: form.specialistType,
            reason: form.reason,
            status: "pending",
            createdAt: Date.now(),
          },
        },
      };

      // Generate QR code as PNG data URL
      const qrDataURL = await QRCode.toDataURL(JSON.stringify(vc), {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      setResult({ qrDataURL, credential: vc, referralId });
    } catch (err) {
      console.error("Failed to generate referral:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setForm({ patientName: "", specialistType: "Cardiologist", reason: "" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-4rem)] p-6"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <FileText size={28} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Referral Generator</h1>
            <p className="text-slate-400 text-sm">Create structured referrals for specialists</p>
          </div>
        </div>

        {result ? (
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white">Referral Generated</h2>
              <p className="text-slate-400">Scan the QR code with the patient's VitaChain app.</p>
            </div>
            <div className="flex flex-col items-center gap-6">
              <QRCodeDisplay
                qrDataURL={result.qrDataURL}
                credential={result.credential}
                onDone={handleReset}
                onScanAnother={handleReset}
              />
            </div>
          </div>
        ) : (
          <div className="glass-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Patient Name</label>
                  <input
                    type="text"
                    value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                    required
                    placeholder="Enter patient name"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Specialist Type</label>
                  <select
                    value={form.specialistType}
                    onChange={(e) => setForm({ ...form, specialistType: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <option>Cardiologist</option>
                    <option>Endocrinologist</option>
                    <option>Neurologist</option>
                    <option>Orthopedic</option>
                    <option>Pulmonologist</option>
                    <option>General Practitioner</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Referral</label>
                  <textarea
                    rows={4}
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    required
                    placeholder="Describe why the patient needs to see a specialist..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={generating}
                  className="btn-primary flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Generate Referral
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
}
