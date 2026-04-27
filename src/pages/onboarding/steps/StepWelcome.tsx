import { motion } from 'framer-motion';
import { useTranslation } from '../../../services/translation/useTranslation';

interface StepWelcomeProps {
  onNext: () => void;
}

export default function StepWelcome({ onNext }: StepWelcomeProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center space-y-8"
    >
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-5xl shadow-lg shadow-teal-500/30">
        🩺
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-3">Welcome to VitaChain</h1>
        <p className="text-lg text-slate-300 leading-relaxed">
          Your health, your guardian. The world's first decentralized health platform that works
          completely offline and puts you in control.
        </p>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-xl text-left space-y-4">
        <h3 className="font-semibold text-teal-300 mb-3">Key Features</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-3">
            <span className="text-teal-500 mt-0.5">✓</span>
            <span>Complete ownership of your health records</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-teal-500 mt-0.5">✓</span>
            <span>Instant QR-code sharing with any clinician</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-teal-500 mt-0.5">✓</span>
            <span>On-device AI assistant for medical queries</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-teal-500 mt-0.5">✓</span>
            <span>Community outbreak detection via mesh network</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-teal-500 mt-0.5">✓</span>
            <span>100+ languages supported, works offline</span>
          </li>
        </ul>
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] shadow-lg"
      >
        Get Started →
      </button>
    </motion.div>
  );
}
