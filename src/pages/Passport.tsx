import { motion } from "framer-motion";
import { QrCode, Download, Share2, Shield, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getCurrentHealthState } from "../services/healthGraph";
import { generatePassport } from "../services/passport";

export default function Passport() {
  const { user } = useAuth();
  const [qrDataURL, setQrDataURL] = useState(null);
  const [healthSummary, setHealthSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function createPassport() {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const healthState = getCurrentHealthState();
        setHealthSummary({
          conditions: healthState.conditions,
          medications: healthState.medications,
          allergies: healthState.allergies,
          encounters: healthState.encounters,
        });
        const result = await generatePassport("Primary Care", user.id);
        setQrDataURL(result.qrDataURL);
      } catch (err) {
        console.error("Passport generation failed:", err);
        setError("Failed to generate passport QR");
      } finally {
        setLoading(false);
      }
    }
    createPassport();
  }, [user]);

  const handleDownload = () => {
    if (!qrDataURL) return;
    const link = document.createElement("a");
    link.download = "vitapassport-qr.png";
    link.href = qrDataURL;
    link.click();
  };

  const handleShare = async () => {
    if (!qrDataURL) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My VitaPassport",
          text: "Scan to view my health summary",
          url: window.location.origin + "/passport?share=me",
        });
      } catch (e) { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.origin + "/passport?share=me");
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
              disabled={!qrDataURL}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/30 text-slate-300 transition-all disabled:opacity-50"
              title="Download QR"
            >
              <Download size={18} />
            </button>
            <button
              onClick={handleShare}
              disabled={!qrDataURL}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/30 text-slate-300 transition-all disabled:opacity-50"
              title="Share"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* QR Code card */}
        <div className="glass-card p-6 text-center mb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center w-48 h-48 mx-auto">
              <Loader2 className="animate-spin text-teal-400 mb-2" size={32} />
              <p className="text-sm text-slate-400">Generating secure QR...</p>
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm py-8">{error}</div>
          ) : (
            <div className="inline-flex items-center justify-center w-48 h-48 bg-white rounded-xl mb-4 overflow-hidden">
              {qrDataURL && <img src={qrDataURL} alt="Health Passport QR" className="w-full h-full object-contain" />}
            </div>
          )}
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

          {!healthSummary ? (
            <div className="text-slate-400 text-sm">No health data available.</div>
          ) : (
            <div className="space-y-4">
              {healthSummary.conditions?.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Conditions</h3>
                  <div className="flex flex-wrap gap-2">
                    {healthSummary.conditions.map((c) => (
                      <span key={c.id} className="px-3 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-sm border border-rose-500/20">{c.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {healthSummary.medications?.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Medications</h3>
                  <ul className="space-y-1">
                    {healthSummary.medications.map((m) => (
                      <li key={m.id} className="text-slate-300 text-sm flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-teal-400" />
                        {m.name} {m.dose} — {m.frequency}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {healthSummary.allergies?.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Allergies</h3>
                  <div className="flex flex-wrap gap-2">
                    {healthSummary.allergies.map((a) => (
                      <span key={a.id} className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-sm border border-amber-500/20">{a.substance}</span>
                    ))}
                  </div>
                </div>
              )}

              {healthSummary.encounters?.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Recent Encounters</h3>
                  <div className="space-y-2">
                    {healthSummary.encounters.slice(-3).map((e) => (
                      <div key={e.id} className="text-sm text-slate-300 border-l-2 border-slate-700 pl-3">
                        <div>{e.facilityName}</div>
                        <div className="text-xs text-slate-500">{e.date} — {e.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security note */}
        <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex gap-3">
            <Shield className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-slate-300">
              <p className="font-medium text-amber-300 mb-1">Security Notice</p>
              <p>
                Your QR code contains signed health data. Only share it with trusted healthcare providers.
                You can revoke access at any time from Settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
