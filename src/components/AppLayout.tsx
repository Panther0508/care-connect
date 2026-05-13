import { ReactNode, useEffect, useState } from "react";
import { OnlineStatusPill } from "./OnlineStatusPill";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { AnimatePresence, motion } from "framer-motion";
import { useStatus } from "../hooks/useStatus";
import OutbreakAlertNotifier from "./OutbreakAlertNotifier";
import { Menu, X, Lock, ArrowLeft } from "lucide-react";
import { useIDB } from "../hooks/useIDB";
import StatusToastContainer from "./StatusToastContainer";
import SideMenu from "./SideMenu";
import { getSetting, storeSetting } from "../lib/idb";
import { useLocation, useNavigate } from "react-router-dom";

const IS_TEST_MODE = import.meta.env.VITE_E2E_MODE === 'true';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isOnline = useOnlineStatus();
  const { showStatus } = useStatus();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const { ready: idbReady } = useIDB();
  const location = useLocation();
  const navigate = useNavigate();

  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);

  // Determine if we should show back button (not on home page)
  const showBackButton = location.pathname !== '/';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const [guestModeEnabled, setGuestModeEnabled] = useState(false);
  const [showPinGate, setShowPinGate] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const checkGuestMode = async () => {
      if (IS_TEST_MODE) {
        setGuestModeEnabled(false);
        setShowPinGate(false);
        return;
      }
      if (!idbReady) return;
      try {
        const enabled = await getSetting<boolean>('guest_mode_enabled');
        if (enabled) {
          const verifiedRecord = await getSetting<{ts: number}>('guest_verified_session');
          const now = Date.now();
          if (verifiedRecord && (now - (verifiedRecord.ts || 0) < 300000)) {
            setGuestModeEnabled(false);
            setShowPinGate(false);
          } else {
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

  const verifyPin = async (pin: string): Promise<boolean> => {
    try {
      const storedHash = await getSetting<string>('guest_pin_hash');
      if (!storedHash) return false;
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
      await storeSetting('guest_verified_session', { ts: Date.now() });
      setShowPinGate(false);
    } else {
      setPinError("Incorrect PIN");
      setPinInput("");
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950">
      {!IS_TEST_MODE && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
        </div>
      )}

      <OnlineStatusPill />
      <StatusToastContainer />
      <OutbreakAlertNotifier />

      <AnimatePresence>
        {showPinGate && !IS_TEST_MODE && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            style={{ background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-3xl p-8 max-w-sm w-full mx-auto text-center"
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
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/30 rounded-xl text-center text-2xl tracking-[0.5em] font-mono text-slate-100 focus:border-teal-400"
                  placeholder="••••"
                  autoFocus
                />
                {pinError && <p className="text-rose-400 text-sm">{pinError}</p>}
                <button type="submit" disabled={verifying || pinInput.length < 4} className="w-full py-3 bg-teal-600 rounded-xl">
                  {verifying ? 'Verifying...' : 'Unlock'}
                </button>
              </form>
              <button type="button" onClick={() => setShowPinGate(false)} className="text-xs underline mt-2">
                Continue in Guest Mode
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`fixed top-4 left-4 z-40 flex items-center gap-3 transition-transform duration-300 ${
        headerVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'
      }`}>
        {showBackButton && (
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <button onClick={() => setSideMenuOpen(true)} className="p-3 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors">
          <Menu size={20} />
        </button>
        <a href="/" className="text-lg font-bold hidden sm:block">VitaChain</a>
      </div>

      <SideMenu open={sideMenuOpen} onOpenChange={setSideMenuOpen} />

      <main className="relative z-10 min-h-screen">
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}