import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Download, Share2, Shield, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getCurrentHealthState, initHealthGraph } from "../services/healthGraph";
import { generatePassport } from "../services/passport";
import LoadingSpinner from "../components/LoadingSpinner";
import ClinicianTypeSelector from "../components/ClinicianTypeSelector";
import ScrollReveal from "../components/ScrollReveal";
import MagneticButton from "../components/MagneticButton";

const sectionStagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const sectionItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function Passport() {
  const { user } = useAuth();
  const [qrDataURL, setQrDataURL] = useState<string | null>(null);
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClinicianType, setSelectedClinicianType] = useState<string | null>(null);

  // Load health summary on mount
  useEffect(() => {
    async function loadSummary() {
      try {
        await initHealthGraph();
        const state = getCurrentHealthState();
        setHealthSummary({
          conditions: state.conditions,
          medications: state.medications,
          allergies: state.allergies,
          encounters: state.encounters,
        });
      } catch (err) {
        console.error("Failed to load health summary:", err);
      }
    }
    loadSummary();
  }, []);

  const handleGenerate = async () => {
    if (!selectedClinicianType || !user) return;
    setLoading(true);
    setError(null);
    try {
      // Ensure health graph is ready
      await initHealthGraph();
      const result = await generatePassport(selectedClinicianType, user.id);
      setQrDataURL(result.qrDataURL);
    } catch (err) {
      console.error("Passport generation failed:", err);
      setError("Failed to generate passport QR");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="w-full">
      <div className="p-4 pb-24">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">VitaPassport</h1>
              <p className="text-base text-slate-400">Your portable health summary</p>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                disabled={!qrDataURL}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/30 text-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Download QR"
              >
                <Download size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                disabled={!qrDataURL}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/30 text-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Share"
              >
                <Share2 size={18} />
              </motion.button>
            </div>
          </div>
        </ScrollReveal>

        {/* Clinician Type Selector */}
        <ScrollReveal delay={80}>
          <ClinicianTypeSelector selected={selectedClinicianType} onSelect={setSelectedClinicianType} />
        </ScrollReveal>

        {/* Generate Button */}
        <ScrollReveal delay={120}>
          <MagneticButton
            onClick={handleGenerate}
            disabled={!selectedClinicianType || loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 min-h-[56px] flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode size={20} />
                Generate Health Passport
              </>
            )}
          </MagneticButton>
        </ScrollReveal>

        {error && (
          <ScrollReveal>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm text-center"
            >
              {error}
            </motion.div>
          </ScrollReveal>
        )}

        {/* QR Display */}
        <AnimatePresence>
          {qrDataURL && (
            <ScrollReveal key="qr">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="mt-8 glass-card p-6 rounded-2xl text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Shield className="text-teal-400" size={20} />
                  <h2 className="text-lg font-semibold text-slate-100">Your VitaPassport QR</h2>
                </div>
                <motion.img
                  src={qrDataURL}
                  alt="Passport QR"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mx-auto mb-4 rounded-xl border border-slate-700/50 shadow-lg"
                />
                <p className="text-sm text-slate-400 mb-4">
                  Scan this QR code with any clinician's VitaChain app to access your health summary.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <FileText size={14} />
                  <span>Valid as of {new Date().toLocaleDateString()}</span>
                </div>
              </motion.div>
            </ScrollReveal>
          )}
        </AnimatePresence>

        {/* Health Summary Preview */}
        {healthSummary && (
          <ScrollReveal delay={100}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={sectionStagger}
              className="mt-8 space-y-4"
            >
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <FileText className="text-teal-400" size={18} />
                Health Summary
              </h3>

              {/* Conditions */}
              {healthSummary.conditions?.length > 0 && (
                <motion.div variants={sectionItem} className="glass-card p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Conditions</h4>
                  <ul className="space-y-1">
                    {healthSummary.conditions.map((c: any, i: number) => (
                      <li key={i} className="text-sm text-slate-400">
                        • {c.name} {c.diagnosedDate && `(since ${c.diagnosedDate})`}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Medications */}
              {healthSummary.medications?.length > 0 && (
                <motion.div variants={sectionItem} className="glass-card p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Medications</h4>
                  <ul className="space-y-1">
                    {healthSummary.medications.map((m: any, i: number) => (
                      <li key={i} className="text-sm text-slate-400">
                        • {m.name} {m.dose} — {m.frequency}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Allergies */}
              {healthSummary.allergies?.length > 0 && (
                <motion.div variants={sectionItem} className="glass-card p-4 rounded-xl border-amber-500/20">
                  <h4 className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Allergies
                  </h4>
                  <ul className="space-y-1">
                    {healthSummary.allergies.map((a: any, i: number) => (
                      <li key={i} className="text-sm text-slate-400">
                        • {a.substance} — {a.reaction} ({a.severity})
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
