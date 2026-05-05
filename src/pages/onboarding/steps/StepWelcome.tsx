import { motion } from 'framer-motion';
import { useTranslation } from '../../../services/translation/useTranslation';
import { CheckCircle, Shield, Brain, Globe, QrCode } from 'lucide-react';

interface StepWelcomeProps {
  onNext: () => void;
}

export default function StepWelcome({ onNext }: StepWelcomeProps) {
  const { t } = useTranslation();

  const features = [
    { icon: Shield, text: 'Complete ownership of your health records' },
    { icon: QrCode, text: 'Instant QR-code sharing with any clinician' },
    { icon: Brain, text: 'On-device AI assistant for medical queries' },
    { icon: Globe, text: 'Community outbreak detection via mesh network' },
    { icon: CheckCircle, text: '100+ languages supported, works offline' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center space-y-8"
    >
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-500/30">
        <span className="text-5xl">🩺</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-3">Welcome to VitaChain</h1>
        <p className="text-lg text-slate-300 leading-relaxed">
          Your health, your guardian. The world's first decentralized health platform that works
          completely offline and puts you in control.
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl text-left space-y-4">
        <h3 className="font-semibold text-teal-400 mb-3 flex items-center gap-2">
          <CheckCircle size={18} />
          Key Features
        </h3>
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <feature.icon size={12} className="text-teal-400" />
              </div>
              <span className="text-sm text-slate-300">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onNext}
        className="btn-primary w-full py-4 rounded-2xl text-lg font-semibold hover:scale-103 active:scale-97 transition-all duration-200 min-h-[56px]"
      >
        Get Started →
      </button>
    </motion.div>
  );
}