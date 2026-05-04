import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { isBiometricAvailable, getBiometricType, biometricVerify } from '../../../lib/biometric/biometricAuth';
import MagnifyingLoader from '../../../components/MagnifyingLoader';

interface StepBiometricsProps {
  onNext: () => void;
  onBack: () => void;
  onUpdate: (updates: { biometricsEnabled: boolean }) => void;
  enabled: boolean;
}

export default function StepBiometrics({ onNext, onBack, onUpdate, enabled: initialEnabled }: StepBiometricsProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [checking, setChecking] = useState(true);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const available = await isBiometricAvailable();
      setIsAvailable(available);

      if (available) {
        const type = await getBiometricType();
        setBiometricType(type);
      }
    } catch (err) {
      console.error('Biometric check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  const testBiometric = async () => {
    setTesting(true);
    setError('');

    try {
      const result = await biometricVerify('Test biometric authentication');
      if (result.success) {
        setEnabled(true);
        onUpdate({ biometricsEnabled: true });
      } else {
        setError(result.error || 'Biometric verification failed');
      }
    } catch (err) {
      setError('Biometric test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSkip = () => {
    onUpdate({ biometricsEnabled: false });
    onNext();
  };

  const handleContinue = () => {
    if (enabled) {
      onNext();
    }
  };

   if (checking) {
     return (
       <div className="text-center py-12">
         <MagnifyingLoader size={40} />
         <p className="text-slate-400">Checking biometric support...</p>
       </div>
     );
   }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Enable Biometric Unlock</h2>
        <p className="text-slate-400">
          Use your fingerprint or face to quickly unlock VitaChain after your passphrase expires.
        </p>
      </div>

      {!isAvailable ? (
        <div className="bg-slate-800/50 p-6 rounded-xl text-center">
          <div className="text-4xl mb-4">📱</div>
          <h3 className="font-semibold mb-2">Biometrics Not Available</h3>
          <p className="text-sm text-slate-400 mb-4">
            Your device doesn't support biometric authentication, or you're running in a web browser.
            You'll use your passphrase to unlock the app.
          </p>
          <button
            onClick={handleSkip}
            className="px-6 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Continue Without Biometrics
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-800/40 p-6 rounded-xl flex items-center gap-4">
            <span className="text-4xl">🔓</span>
            <div>
              <div className="font-semibold">Biometric Authentication Available</div>
              <div className="text-sm text-slate-400 capitalize">
                {biometricType === 'fingerprint' && 'Fingerprint / Touch ID'}
                {biometricType === 'face' && 'Face Recognition / Face ID'}
                {biometricType === 'iris' && 'Iris Scanner'}
                {biometricType === 'device-credentials' && 'Device PIN / Pattern'}
                {!biometricType && 'Biometric'}
              </div>
            </div>
          </div>

          {enabled ? (
            <div className="bg-green-900/30 border border-green-700 text-green-200 p-4 rounded-lg text-center">
              ✓ Biometric authentication enabled. You can use it to unlock the app.
            </div>
          ) : (
            <button
              onClick={testBiometric}
              disabled={testing}
              className="w-full py-4 bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {testing ? 'Verifying...' : 'Test Biometric Authentication'}
            </button>
          )}

          {error && <div className="text-red-400 text-sm text-center">{error}</div>}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!enabled && isAvailable}
          className="flex-1 py-3 bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-teal-500 transition-colors font-semibold"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
