import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
    >
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-6">Last updated: May 2026</p>

        <div className="glass-card p-6 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              VitaChain collects health information you provide directly, including conditions, medications, allergies, vitals, and medical history. This data is stored exclusively on your device using AES-256-GCM encryption.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Local Storage</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              All health data is stored locally in your browser's IndexedDB. No health data is transmitted to our servers unless you explicitly choose to export or share it (e.g., VitaPassport QR code generation).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. AI Processing</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              When using the AI assistant, queries may be sent to online models (Gemma 4) or processed offline using TinyLlama. Online queries are handled via secure API with no personal identifiers. Offline processing never leaves your device.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Third-Party Services</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We use Clerk for authentication. Medical knowledge comes from integrated open datasets. Neither has access to your health data stored locally.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Data Sharing</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your data is never sold. You may voluntarily share your VitaPassport with healthcare providers via QR code. Export functionality allows you to download your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Children's Privacy</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              VitaChain is not intended for children under 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Your Rights</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              You may export all your data at any time from Settings. You may delete your account and all associated data via the Delete Account feature. Guest mode allows privacy on shared devices without persistent data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Security</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We employ industry-standard encryption, secure authentication via Clerk, and optional biometric/PIN protection. Data at rest is encrypted using AES-256-GCM.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Changes to Policy</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We may update this privacy policy from time to time. The latest version is always available in the app. Continued use after changes constitutes acceptance.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
