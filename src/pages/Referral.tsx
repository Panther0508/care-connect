import { motion } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';

export default function Referral() {
  const { user } = useAuth();

  const referralCode = user ? `VITA-${user.id.slice(-6).toUpperCase()}` : 'SIGNUP';
  const referralLink = `https://vitachain.health/ref/${referralCode}`;

  const handleShare = async (method: 'copy' | 'whatsapp') => {
    if (method === 'copy') {
      await navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard!');
    } else if (method === 'whatsapp') {
      const text = encodeURIComponent(`Join VitaChain and get 1 month free premium! Use my code: ${referralCode} or click: ${referralLink}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Refer a Friend</h1>
        <p className="text-slate-400">Share VitaChain and earn premium benefits</p>
      </div>

      <div className="bg-gradient-to-br from-teal-900/40 to-cyan-900/40 rounded-xl p-6 border border-teal-700/30 text-center">
        <div className="text-4xl mb-3">🎁</div>
        <h3 className="text-lg font-semibold mb-2">You Get 1 Month Free</h3>
        <p className="text-sm text-slate-300 mb-4">
          When your friend signs up and completes onboarding, both of you receive 1 month of Premium.
        </p>

        <div className="bg-slate-800/60 rounded-lg p-4 mb-4">
          <label className="text-xs text-slate-400 block mb-1">Your Referral Code</label>
          <div className="text-2xl font-mono font-bold text-teal-300 tracking-wider">{referralCode}</div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => handleShare('copy')}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Copy Link
          </button>
          <button
            onClick={() => handleShare('whatsapp')}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
          >
            Share on WhatsApp
          </button>
        </div>
      </div>

      <div className="bg-slate-800/40 p-4 rounded-lg text-sm text-slate-300">
        <h4 className="font-semibold mb-2">How it works</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Share your unique link or code with a friend</li>
          <li>They sign up and complete onboarding</li>
          <li>Both of you get 1 month of Premium free</li>
          <li>You can refer up to 5 friends</li>
        </ol>
      </div>
    </motion.div>
  );
}
