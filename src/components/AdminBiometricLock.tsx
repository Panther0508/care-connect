import { useState, useEffect, useCallback, useRef } from 'react';
import { biometricVerify, isBiometricAvailable } from '@/lib/biometric/biometricAuth';
import { adminAuditLogger } from '@/services/adminAuditLogger';
import { useAuth } from '@/context/AuthContext';
import MagnifyingLoader from './MagnifyingLoader';

interface AdminBiometricLockProps {
  children: React.ReactNode;
  timeoutMinutes?: number;
  warningMinutes?: number;
  devSkipBiometric?: boolean;
  devAutoVerify?: boolean;
}

export default function AdminBiometricLock({
  children,
  timeoutMinutes = 15,
  warningMinutes = 2,
  devSkipBiometric = false,
  devAutoVerify = false,
}: AdminBiometricLockProps) {
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isChecking, setIsChecking] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningThresholdMs = warningMinutes * 60 * 1000;
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redirectRef = useRef(false);
  const { user } = useAuth();

  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const FALLBACK_PIN = '0000'; // Mock PIN for web fallback

  const triggerBiometricCheck = useCallback(async () => {
    if (redirectRef.current) return;
    if (devSkipBiometric) {
      setBiometricVerified(true);
      setLastActivity(Date.now());
      return;
    }

    setIsChecking(true);

    try {
      const available = await isBiometricAvailable();
      if (!available && !devAutoVerify) {
        // If not available (e.g. on web), show fallback PIN instead of failing
        setShowPinModal(true);
        setIsChecking(false);
        return;
      }

      if (devAutoVerify) {
        setBiometricVerified(true);
        setLastActivity(Date.now());
      } else {
        const result = await biometricVerify('Authenticate to access admin area');
        if (result.success) {
          setBiometricVerified(true);
          setLastActivity(Date.now());
          // Log successful biometric auth
          if (user?.id) {
            adminAuditLogger.log(
              user.id,
              'biometric.success',
              'admin_access',
              {},
              (user.publicMetadata as any)?.did
            );
          }
        } else {
          // Log biometric failure
          if (user?.id) {
            adminAuditLogger.log(
              user.id,
              'biometric.failed',
              'admin_access',
              { reason: result.error || 'verification_failed' },
              (user.publicMetadata as any)?.did
            );
          }
          redirectRef.current = true;
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      console.error('Biometric check failed:', error);
      if (user?.id) {
        adminAuditLogger.log(
          user.id,
          'biometric.error',
          'admin_access',
          { error: error instanceof Error ? error.message : 'unknown' },
          (user.publicMetadata as any)?.did
        );
      }
      redirectRef.current = true;
      window.location.href = '/dashboard';
    } finally {
      if (available) setIsChecking(false);
    }
  }, [devSkipBiometric, devAutoVerify, user]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === FALLBACK_PIN) {
      setShowPinModal(false);
      setBiometricVerified(true);
      setLastActivity(Date.now());
      if (user?.id) {
        adminAuditLogger.log(user.id, 'biometric.success', 'admin_access_fallback', {}, (user.publicMetadata as any)?.did);
      }
    } else {
      setPinInput('');
      if (user?.id) {
        adminAuditLogger.log(user.id, 'biometric.failed', 'admin_access_fallback', { reason: 'invalid_pin' }, (user.publicMetadata as any)?.did);
      }
      redirectRef.current = true;
      window.location.href = '/dashboard';
    }
  };

  // Handle user activity
  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Check if inactivity timeout has been reached
  const checkInactivity = useCallback(() => {
    if (!biometricVerified || isChecking) return;
    const now = Date.now();
    const idleTime = now - lastActivity;

    // Show warning if within warning threshold but not yet timed out
    if (idleTime >= (timeoutMs - warningThresholdMs) && idleTime < timeoutMs && !showWarning) {
      setShowWarning(true);
    }

    // Lock out if timeout reached
    if (idleTime >= timeoutMs) {
      setBiometricVerified(false);
      triggerBiometricCheck();
    }
  }, [biometricVerified, lastActivity, timeoutMs, isChecking, showWarning, warningThresholdMs, triggerBiometricCheck]);

  // Mount effect: initial biometric check
  useEffect(() => {
    triggerBiometricCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Visibility change effect
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsVisible(true);
        triggerBiometricCheck();
      } else {
        setIsVisible(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerBiometricCheck]);

  // Activity tracking effect
  useEffect(() => {
    const events = ['mousemove', 'keypress', 'click', 'touchstart'];
    const handleActivity = () => {
      setLastActivity(Date.now());
      // Dismiss warning if user becomes active
      if (showWarning) {
        setShowWarning(false);
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [showWarning]);

  // Periodic inactivity check
  useEffect(() => {
    checkIntervalRef.current = setInterval(checkInactivity, 60 * 1000); // Check every minute
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkInactivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Loading state during initial check
   if (isChecking && !biometricVerified) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-slate-900">
         <div className="flex flex-col items-center gap-4">
           <MagnifyingLoader size={40} />
           <p className="text-slate-300">Verifying biometric authentication...</p>
         </div>
       </div>
     );
   }

  // Calculate remaining time for warning
  const now = Date.now();
  const idleTime = now - lastActivity;
  const remainingTime = Math.max(0, timeoutMs - idleTime);

  return (
    <>
      {children}

      {/* Fallback PIN Modal for Web */}
      {showPinModal && !biometricVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Authentication Required</h3>
              <p className="text-sm text-slate-400">
                Biometrics are unavailable on this device. Please enter your PIN to continue. (Default: 0000)
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center text-2xl tracking-[0.5em] font-mono bg-slate-800 border border-slate-700 rounded-lg py-3 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                placeholder="••••"
                autoFocus
              />
              <button
                type="submit"
                disabled={pinInput.length !== 4}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Verify PIN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Session Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Session Expiring Soon</h3>
                <p className="text-sm text-slate-400">
                  You'll be logged out in {Math.floor(remainingTime / 60000)}m {Math.floor((remainingTime % 60000) / 1000)}s
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6">
              For security, your admin session will expire due to inactivity.
              Click below to remain signed in.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setLastActivity(Date.now());
                  setShowWarning(false);
                  // Log session extension
                  if (user?.id) {
                    adminAuditLogger.log(
                      user.id,
                      'session.extended',
                      'admin_session',
                      {},
                      (user.publicMetadata as any)?.did
                    );
                  }
                }}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
              >
                Stay Signed In
              </button>
              <button
                onClick={() => {
                  setBiometricVerified(false);
                  triggerBiometricCheck();
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Verified Indicator */}
      {biometricVerified && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 px-3 py-1.5 rounded-full shadow-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-200">Verified</span>
          </div>
        </div>
      )}
    </>
  );
}
