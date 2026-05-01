import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Shield, Check } from 'lucide-react';
import { initiateSquadPayment } from '../services/squadPayment';
import { useAuth } from '@clerk/clerk-react';
import { useStatus } from '../hooks/useStatus';

interface SquadPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PLANS = [
  {
    id: 'premium',
    name: 'Premium (Oga)',
    price: 2500,
    features: [
      '5 family profiles',
      'Unlimited passport shares',
      'Advanced AI (Meissa 4B)',
      'Priority mesh',
      'All language packs',
    ],
  },
];

export default function SquadPaymentModal({ open, onClose, onSuccess }: SquadPaymentModalProps) {
  const { user } = useAuth();
  const { showStatus } = useStatus();
  const [processing, setProcessing] = useState(false);
  const [selectedPlan] = useState(PLANS[0]);

  const handlePay = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      const result = await initiateSquadPayment({
        amount: selectedPlan.price,
        plan: selectedPlan.id,
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
      });

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        showStatus('error', 'Payment Error', result.error || 'Could not start payment');
      }
    } catch (err: any) {
      showStatus('error', 'Payment Failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <CreditCard className="text-teal-400" size={20} />
                <h2 className="text-lg font-bold text-white">Upgrade to Premium</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-teal-900/20 border border-teal-500/30 rounded-xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-teal-300">{selectedPlan.name}</h3>
                  <span className="text-2xl font-bold text-white">₦{selectedPlan.price.toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">One-time payment • Instant activation</p>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-200">
                      <Check size={16} className="text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield size={14} className="text-teal-400" />
                <span>Secure payment powered by Squad • PCI compliant</span>
              </div>
            </div>

            <div className="p-4 border-t border-white/5 flex gap-3">
              <button onClick={onClose} className="flex-1 btn-secondary py-3">
                Cancel
              </button>
              <button onClick={handlePay} disabled={processing} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay ₦{selectedPlan.price.toLocaleString()}</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
