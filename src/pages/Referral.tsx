import { motion } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useStatus } from '../hooks/useStatus';
import { Share2, Check, Gift, Users } from 'lucide-react';
import { generateOrGetReferralCode } from '../services/referralEngine';
import { getSetting, storeSetting } from '../lib/idb';

export default function Referral() {
  const { user, isLoaded } = useAuth();
  const { showStatus } = useStatus();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    const loadReferralCode = async () => {
      if (!isLoaded || !user) return;

      try {
        // Use centralized service that handles localStorage caching & Clerk
        const code = await generateOrGetReferralCode(user);
        setReferralCode(code);

        // Load referral count from IDB (instead of localStorage)
        const count = await getSetting<number>(`referral_count_${user.id}`);
        setReferralCount(count ?? 0);
      } catch (err) {
        console.error('Failed to load/generate referral code:', err);
        // Fallback: generate temporary code (not persisted)
        setReferralCode(`TEMP-${user.id.slice(-6).toUpperCase()}`);
      } finally {
        setLoading(false);
      }
    };

    loadReferralCode();
  }, [user, isLoaded]);

  const referralLink = referralCode ? `https://vitachain.health/ref/${referralCode}` : '';

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showStatus('success', 'Copied!', 'Referral link copied to clipboard', { duration: 3000 });
  };

  const handleWhatsApp = () => {
    if (!referralCode) return;
    const text = encodeURIComponent(
      `Join VitaChain and get 1 month free premium! Use my code: ${referralCode} or click: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
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

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-teal-900/40 to-cyan-900/40 rounded-2xl p-6 border border-teal-700/30 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/20 flex items-center justify-center">
          <Gift className="text-teal-400" size={32} />
        </div>
        <h3 className="text-xl font-semibold mb-2">You Get 1 Month Free</h3>
        <p className="text-sm text-slate-300 mb-6 max-w-xs mx-auto">
          When your friend signs up and completes onboarding, both of you receive 1 month of Premium.
        </p>

        {/* Referral Code Display */}
        <div className="bg-slate-800/60 rounded-xl p-5 mb-6 border border-slate-700/50">
          <label className="text-xs text-slate-400 block mb-2 uppercase tracking-wider">Your Referral Code</label>
          {loading ? (
            <div className="w-32 h-8 bg-slate-700/50 rounded animate-pulse mx-auto" />
          ) : (
            <div className="text-3xl font-mono font-bold text-teal-300 tracking-wider">{referralCode}</div>
          )}
          <p className="text-xs text-slate-500 mt-2">One-time code, never changes</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleCopy}
            disabled={!referralCode}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-xl font-medium transition-colors"
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={handleWhatsApp}
            disabled={!referralCode}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            Share on WhatsApp
          </button>
        </div>
      </div>

      {/* Stats & How It Works */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-teal-400" size={20} />
            <span className="font-semibold text-white">Referrals Used</span>
          </div>
          <div className="text-3xl font-bold text-white">{referralCount}</div>
          <p className="text-xs text-slate-400 mt-1">Friends who signed up</p>
        </div>

        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="text-amber-400" size={20} />
            <span className="font-semibold text-white">Your Reward</span>
          </div>
          <div className="text-lg font-bold text-amber-300">1 Month Premium</div>
          <p className="text-xs text-slate-400 mt-1">Per successful referral</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
        <h4 className="font-semibold text-white mb-3">How it works</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
          <li>Share your unique code or link with a friend</li>
          <li>They sign up and complete the onboarding process</li>
          <li>Both of you receive 1 month of Premium free</li>
          <li>You can refer up to 5 friends (max 5 months free)</li>
        </ol>
      </div>

      {/* Debug: manual increment for testing */}
      {import.meta.env.DEV && (
        <div className="border-t border-slate-700 pt-4 mt-4">
        <button
          onClick={async () => {
            const newCount = referralCount + 1;
            setReferralCount(newCount);
            if (user) {
              await storeSetting(`referral_count_${user.id}`, newCount);
            }
          }}
          className="text-xs text-slate-500 underline"
        >
            [Dev] Simulate successful referral
          </button>
        </div>
      )}
    </motion.div>
  );
}
