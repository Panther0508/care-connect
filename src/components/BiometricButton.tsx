import { useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { isBiometricAvailable, getBiometricType, biometricVerify, registerBiometric, isBiometricRegistered } from '../services/biometricAuth';

interface BiometricButtonProps {
  userId?: string; // For registration lookup
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onRegisterRequired?: () => void;
}

export default function BiometricButton({ userId, onSuccess, onError, onRegisterRequired }: BiometricButtonProps) {
  const [checking, setChecking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleClick = async () => {
    if (verifying) return;
    setVerifying(true);

    try {
      const available = await isBiometricAvailable();
      if (!available) {
        onError?.('Biometric authentication not available on this device');
        setVerifying(false);
        return;
      }

      // Check if already registered (for web)
      if (userId) {
        const isRegistered = await isBiometricRegistered(userId);
        if (!isRegistered) {
          onRegisterRequired?.();
          setVerifying(false);
          return;
        }
      }

      const result = await biometricVerify('Authenticate to access VitaChain');

      if (result.success) {
        onSuccess?.();
      } else {
        onError?.(result.error || 'Biometric verification failed');
      }
    } catch (err: any) {
      onError?.(err.message || 'Biometric authentication error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={verifying}
      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Use biometric authentication"
    >
      <Fingerprint size={20} />
      {verifying ? 'Verifying...' : 'Use Biometrics'}
    </button>
  );
}
