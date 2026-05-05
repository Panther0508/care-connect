import { motion } from "framer-motion";

export default function TermsOfService() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
    >
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-6">Last updated: May 2026</p>

        <div className="glass-card p-6 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              By accessing and using VitaChain, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Use License</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Permission is granted to temporarily use VitaChain for personal, non-commercial health management purposes. This is the grant of a license, not a transfer of title.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Health Disclaimer</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              VitaChain provides general health information and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. AI Limitations</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              The AI assistant uses machine learning models that may occasionally produce inaccurate or incomplete information. Users should verify critical health information with healthcare professionals. We do not guarantee the accuracy of AI-generated responses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Privacy & Data</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your health data is encrypted and stored locally on your device. We do not sell your personal information. See our Privacy Policy for complete details on data handling and storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Account Security</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for any activities under your account. Enable biometric lock or PIN for additional security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Limitation of Liability</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              VitaChain and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Contact</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              If you have questions about these Terms of Service, please contact us through the Contact Us page or at support@vitachain.ng.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
