import { useState } from 'react';
import { motion } from 'framer-motion';

interface StepPassphraseProps {
  onNext: () => void;
  onBack: () => void;
  onSave: (updates: { passphrase: string }) => void;
}

export default function StepPassphrase({ onNext, onBack, onSave }: StepPassphraseProps) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');

    if (passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters');
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Save passphrase (will be used later to encrypt health data)
      onSave({ passphrase });
      onNext();
    } catch (error) {
      setError('Failed to secure passphrase. Please try again.');
      console.error('Passphrase handling failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Set Your Passphrase</h2>
        <p className="text-slate-400">
          This encrypts all your health data. Forgetting it means losing access to your records.
        </p>
      </div>

      <div className="bg-amber-900/30 border border-amber-700 text-amber-200 p-4 rounded-lg text-sm">
        ⚠️ <strong>Important:</strong> Write this down somewhere safe. VitaChain cannot recover your passphrase.
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Create Passphrase (min 8 characters)</label>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-teal-500 text-lg"
            placeholder="Enter a strong passphrase"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Confirm Passphrase</label>
          <input
            type="password"
            value={confirmPassphrase}
            onChange={(e) => setConfirmPassphrase(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:border-teal-500 text-lg"
            placeholder="Re-enter your passphrase"
          />
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        <div className="bg-slate-800/40 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Passphrase Tips:</h4>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Use multiple words (e.g., "BlueElephant$42!")</li>
            <li>• Avoid birthdays or common phrases</li>
            <li>• This is different from your account password</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading || passphrase.length < 8}
          className="flex-1 py-3 bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-teal-500 transition-colors font-semibold"
        >
          {isLoading ? 'Securing...' : 'Continue'}
        </button>
      </div>
    </motion.div>
  );
}
