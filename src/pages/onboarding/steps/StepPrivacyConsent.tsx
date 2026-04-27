import { useState } from 'react';
import { motion } from 'framer-motion';

interface StepPrivacyConsentProps {
  onNext: () => void;
  onBack: () => void;
  consent: boolean;
  onUpdate: (updates: { consentGiven: boolean }) => void;
}

export default function StepPrivacyConsent({ onNext, onBack, consent, onUpdate }: StepPrivacyConsentProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const canProceed = consent && termsAccepted;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Privacy & Consent</h2>
        <p className="text-slate-400">
          We're committed to protecting your data under the Nigeria Data Protection Act.
        </p>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 space-y-4 max-h-60 overflow-y-auto">
        <h3 className="font-semibold text-teal-300 mb-2">Your Rights</h3>
        <ul className="text-sm text-slate-300 space-y-2">
          <li>• You own all your health data. We never sell it.</li>
          <li>• Explicit consent required before any clinician accesses your records.</li>
          <li>• You can revoke consent at any time via Settings.</li>
          <li>• Full data export (PDF, JSON, Verifiable Credential) available anytime.</li>
          <li>• Right to erasure: one-tap account deletion wipes all data.</li>
          <li>• All data is encrypted end-to-end with your passphrase.</li>
          <li>• Audit trail logs every access to your health graph.</li>
        </ul>

        <div className="pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400">
            By proceeding, you consent to VitaChain processing your sensitive health data
            for the purpose of providing healthcare services, as required by the NDP Act 2023
            and GAID 2025. This includes storing, synchronizing, and sharing (with your explicit
            consent) your health records with authorized healthcare providers.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onUpdate({ consentGiven: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-slate-600 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-slate-300">
            I understand and consent to have my health data processed according to the Privacy Policy.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-slate-600 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-slate-300">
            I have read and accept the Terms of Service.
          </span>
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 py-3 bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-teal-500 transition-colors font-semibold"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
