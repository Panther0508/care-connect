import { ReactNode, useEffect, useState } from "react";
import { OnlineStatusPill } from "./OnlineStatusPill";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { AnimatePresence, motion } from "framer-motion";
import { useStatus } from "../hooks/useStatus";
import OutbreakAlertNotifier from "./OutbreakAlertNotifier";
import { Menu, X, Lock } from "lucide-react";
import { useIDB } from "../hooks/useIDB";
import StatusToastContainer from "./StatusToastContainer";
import SideMenu from "./SideMenu";
import { getSetting, storeSetting } from "../lib/idb";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isOnline = useOnlineStatus();
  const { showStatus } = useStatus();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  // Initialize offline data and mesh orchestrator globally
  const { ready: idbReady } = useIDB();

  // Guest Mode PIN gate state
  const [guestModeEnabled, setGuestModeEnabled] = useState(false);
  const [showPinGate, setShowPinGate] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [verifying, setVerifying] = useState(false);

   useEffect(() => {
     const checkGuestMode = async () => {
       if (!idbReady) return;
       try {
         const enabled = await getSetting<boolean>('guest_mode_enabled');
         if (enabled) {
           // Check IndexedDB for recent verification instead of sessionStorage
           const verifiedRecord = await getSetting<{ts: number}>('guest_verified_session');
           const now = Date.now();
           // Consider verification valid for 5 minutes (300000 ms)
           if (verifiedRecord && (now - (verifiedRecord.ts || 0) < 300000)) {
             // Already verified recently, no need to show PIN gate
             setGuestModeEnabled(false);
             setShowPinGate(false);
           } else {
             // Need to verify
             setGuestModeEnabled(true);
             setShowPinGate(true);
           }
         }
       } catch (err) {
         console.error('Failed to check guest mode:', err);
       }
     };
     checkGuestMode();
   }, [idbReady]);

  useEffect(() => {
    const handleOnline = () => {
      showStatus('success', 'Back Online', 'Syncing latest health data...');
    };
    const handleOffline = () => {
      showStatus('offline', 'You Are Offline', 'VitaChain is still guarding your health. Your data stays private.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
   }, [showStatus]);

   // Guest Mode PIN handlers
   const verifyPin = async (pin: string): Promise<boolean> => {
     try {
       const storedHash = await getSetting<string>('guest_pin_hash');
       if (!storedHash) return false;
       // Hash the input PIN
       const encoder = new TextEncoder();
       const data = encoder.encode(pin);
       const hashBuffer = await crypto.subtle.digest('SHA-256', data);
       const hashArray = Array.from(new Uint8Array(hashBuffer));
       const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
       return inputHash === storedHash;
     } catch (err) {
       console.error('PIN verification error:', err);
       return false;
     }
   };

    const handlePinSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setPinError("");
      setVerifying(true);
      const isValid = await verifyPin(pinInput);
      setVerifying(false);
      if (isValid) {
        // Store verification in IndexedDB with timestamp (valid 5 minutes)
        await storeSetting('guest_verified_session', { ts: Date.now() });
        setShowPinGate(false);
      } else {
        setPinError("Incorrect PIN");
        setPinInput("");
      }
    };

   return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* ... existing orbs ... */}
      </div>

      <OnlineStatusPill />
      <StatusToastContainer />

      {/* Global outbreak alert listener (no UI) */}
      <OutbreakAlertNotifier />

      {/* Guest Mode PIN Gate Overlay */}
      <AnimatePresence>
        {showPinGate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            style={{
              background: 'rgba(15, 23, 42, 0.98)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-3xl p-8 max-w-sm w-full mx-auto text-center relative"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-teal-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">Enter PIN</h2>
              <p className="text-sm text-slate-400 mb-6">
                Guest Mode is enabled. Please enter your PIN to continue.
              </p>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-center text-2xl tracking-[0.5em] font-mono text-slate-100 focus:border-teal-400 focus:outline-none"
                  placeholder="••••"
                  autoFocus
                />
                {pinError && (
                  <p className="text-rose-400 text-sm">{pinError}</p>
                )}
                <button
                  type="submit"
                  disabled={verifying || pinInput.length < 4}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {verifying ? 'Verifying...' : 'Unlock'}
                </button>
              </form>

              <p className="text-xs text-slate-500 mt-4">
                Forgotten PIN? Contact support to reset your account.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* Side menu button (top-left) + Brand */}
       <div className="fixed top-4 left-4 z-40 flex items-center gap-3">
         <button
           onClick={() => setSideMenuOpen(true)}
           className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white shadow-lg transition-all"
           aria-label="Open navigation menu"
         >
           <Menu size={20} />
         </button>
         <a href="/" className="text-lg font-bold text-white tracking-tight hidden sm:block">
           VitaChain
         </a>
       </div>

      <main className={`relative z-10 min-h-screen pt-16`}>
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8">
          {children}
        </div>
      </main>

      {/* Side Menu */}
      <SideMenu open={sideMenuOpen} onOpenChange={setSideMenuOpen} />
    </div>
  );
}
