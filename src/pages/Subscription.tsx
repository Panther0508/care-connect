import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../services/translation/useTranslation';
import SquadPaymentModal from '../components/SquadPaymentModal';

export default function Subscription() {
  const { t } = useTranslation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Subscription</h1>
        <p className="text-slate-400">Choose the plan that's right for you</p>
      </div>

      <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 text-center">
        <h3 className="text-lg font-semibold mb-2">Current Plan: Free</h3>
        <p className="text-slate-300 mb-4">You are on the Free plan. Upgrade to Premium for unlimited features.</p>
        <button onClick={() => setShowPaymentModal(true)} className="px-8 py-3 bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold transition-colors">
          Upgrade to Premium
        </button>
      </div>

      <div className="grid gap-4">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <h4 className="font-semibold mb-2">Free (Sabi)</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>✓ 1 health profile</li>
            <li>✓ 5 passport shares/month</li>
            <li>✓ Offline AI</li>
            <li>✓ Basic mesh</li>
            <li>✓ 1 language pack</li>
          </ul>
        </div>
        <div className="bg-teal-900/30 p-4 rounded-xl border border-teal-700/50">
          <h4 className="font-semibold mb-2 text-teal-300">Premium (Oga) – ₦2,500/month</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>✓ 5 family profiles</li>
            <li>✓ Unlimited passport shares</li>
            <li>✓ Advanced AI (Meissa 4B)</li>
            <li>✓ Priority mesh</li>
            <li>✓ All languages</li>
          </ul>
        </div>
      </div>

      <SquadPaymentModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
    </motion.div>
  );
}
