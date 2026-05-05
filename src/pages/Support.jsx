import { useState } from 'react';
import { useTranslation } from '../services/translation/useTranslation';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import { useRole } from '../hooks/auth/useRole';
import { addSupportTicket } from '../lib/idb';

export default function Support() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { role } = useRole();
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const faq = [
    {
      q: 'How do I share my health passport?',
      a: 'Go to the Passport tab and tap "Generate QR". Show the QR to any clinician to share your health summary.',
    },
    {
      q: 'Is my data encrypted?',
      a: 'Yes. All health data is encrypted with AES-256-GCM using a key derived from your passphrase. Not even we can access it.',
    },
    {
      q: 'Can I use VitaChain offline?',
      a: 'Absolutely. The app works 100% offline. Your health records, AI assistant, and translations are stored on your device.',
    },
    {
      q: 'How do I delete my account?',
      a: 'Go to Settings → Delete Account. This permanently erases all local data and requests deletion from our servers.',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      await addSupportTicket({
        message: message.trim(),
        userId: user?.id || 'anonymous',
        timestamp: new Date().toISOString(),
        status: 'open',
        userRole: role || 'patient',
      });
      setSubmitted(true);
      setMessage('');
      // Reset after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Failed to submit support ticket:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-bold text-white mb-2">Support</h1>
        <p className="text-slate-400">Get help and answers to common questions</p>
      </div>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Frequently Asked Questions</h2>
        {faq.map((item, idx) => (
          <details key={idx} className="bg-slate-800/50 rounded-lg border border-slate-700/50 group">
            <summary className="font-medium cursor-pointer p-4">{item.q}</summary>
            <div className="px-4 pb-4 text-slate-300 text-sm leading-relaxed border-t border-slate-700/30 pt-2">
              {item.a}
            </div>
          </details>
        ))}
      </section>

      {/* Contact form */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Contact Us</h2>
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-900/30 border border-green-700 p-4 rounded-lg text-green-200"
          >
            Thanks for reaching out! We'll get back to you within 24 hours.
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-teal-500 text-white resize-none"
                placeholder="How can we help?"
                disabled={submitting}
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </section>
    </motion.div>
  );
}
