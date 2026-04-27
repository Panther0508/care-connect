import { motion } from 'framer-motion';

interface StepDoneProps {
  onFinish: () => void;
}

export default function StepDone({ onFinish }: StepDoneProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-8"
    >
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-teal-400 to-green-500 rounded-full flex items-center justify-center text-5xl shadow-lg shadow-teal-500/30">
        ✓
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-3">You're All Set!</h1>
        <p className="text-lg text-slate-300 leading-relaxed">
          Your VitaChain account is ready. Your health data is secure and you're ready to
          experience the future of personal healthcare.
        </p>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-xl space-y-4">
        <h3 className="font-semibold text-teal-300 mb-3">Next Steps</h3>
        <ul className="text-sm text-slate-300 space-y-3 text-left">
          <li className="flex items-start gap-3">
            <span className="text-teal-500 mt-0.5">1.</span>
            <span>Explore your personalized dashboard based on your role</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-teal-500 mt-0.5">2.</span>
            <span>Add more health information in the Health Graph section</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-teal-500 mt-0.5">3.</span>
            <span>Try asking the AI assistant a medical question</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-teal-500 mt-0.5">4.</span>
            <span>Configure your language preferences and notification settings</span>
          </li>
        </ul>
      </div>

      <button
        onClick={onFinish}
        className="w-full py-4 bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-teal-500/30"
      >
        Go to Dashboard →
      </button>
    </motion.div>
  );
}
