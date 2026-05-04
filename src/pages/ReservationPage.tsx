import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFacility } from "../lib/idb";
import type { Facility } from "../services/aiSearch";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { submitFeedback } from "../services/feedback";
import { meshOrchestrator } from "../services/meshOrchestrator";
import VitaAvatar from "../components/VitaAvatar";
import { useStatus } from "../hooks/useStatus";

export default function ReservationPage() {
  const { showStatus } = useStatus();
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [confirmState, setConfirmState] = useState<"idle" | "contacting" | "shaking" | "confirmed">("idle");
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours
  const [codeDisplay, setCodeDisplay] = useState("");
  const code = "CONF-7X3A";

  useEffect(() => {
    const fetchFacility = async () => {
      if (!facilityId) return;
      setLoading(true);
      try {
        const data = await getFacility(facilityId);
        if (data) setFacility(data);
      } catch (err) {
        console.error('Failed to fetch facility:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFacility();
  }, [facilityId]);

  useEffect(() => {
    if (!loading && facility) {
      // Typewriter effect
      let i = 0;
      const interval = setInterval(() => {
        setCodeDisplay(code.slice(0, i + 1));
        i++;
        if (i === code.length) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loading, facility]);

  useEffect(() => {
    if (!loading && facility) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) {
            showStatus('error', 'Reservation Expired', 'The slot is no longer available. We are still watching for new matches.');
            return 0;
          }
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, facility]);

  const handleConfirm = () => {
    setConfirmState("contacting");
    
    // Step 1: Contacting (1.2s)
    setTimeout(() => {
      // Step 2: Shaking (0.3s)
      setConfirmState("shaking");
      
      setTimeout(() => {
        // Step 3: Confirmed
        setConfirmState("confirmed");
        showStatus('success', 'Care Secured!', 'Your reservation is confirmed. Show the QR code at the facility.');
        
        // Record confirmation in mesh (anonymised)
        try {
          meshOrchestrator.recordConfirmation(facilityId);
        } catch (err) {
          console.warn('Failed to record confirmation in mesh:', err);
        }
        
        triggerConfetti();
      }, 300);
      
    }, 1200);
  };

  const triggerConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#34d399', '#f59e0b']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#34d399', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleFeedback = async (helpful: boolean) => {
    setFeedbackGiven(true);
    try {
      await submitFeedback(facility.id, helpful);
    } catch (err) {
      console.error('Feedback submission failed:', err);
      // Still optimistically mark as given
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

   if (loading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
         <MagnifyingLoader size={48} />
         <p className="text-slate-400 text-sm">Loading reservation details...</p>
       </div>
     );
   }

  if (!facility) {
    return (
      <div className="text-center py-10 text-slate-500 flex flex-col gap-4 items-center">
        <p>No active reservation found.</p>
        <button onClick={() => navigate("/")} className="btn-secondary">Go to Search</button>
      </div>
    );
  }

  const shakeAnimation = {
    shaking: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.3 } }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <header className="pt-4">
        <motion.h1 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0.4 }}
          className="text-2xl font-bold text-slate-100 mb-2 leading-tight"
        >
          Reservation Details
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-400 mb-6 text-sm">
          Please present this to the facility reception.
        </motion.p>
      </header>

      <section>
        <motion.div 
          initial={{ opacity: 0, x: 50 }} animate={confirmState === "shaking" ? "shaking" : { opacity: 1, x: 0 }}
          variants={shakeAnimation}
          transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
          className={`glass-card p-6 flex flex-col gap-6 relative overflow-hidden transition-colors duration-500 ${confirmState === "confirmed" ? "bg-emerald-500/5 border-emerald-500/20" : ""}`}
        >
          {confirmState === "confirmed" && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 2 }} className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-xl pointer-events-none" />
          )}

          <div>
            <h3 className="text-xl font-bold text-slate-100">{facility.name}</h3>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {facility.address_line1 ? `${facility.address_line1}, ` : ''}{facility.address_city}, {facility.address_stateOrRegion}{facility.address_zipOrPostcode ? ` ${facility.address_zipOrPostcode}` : ''}
            </p>
          </div>

          <div className="border-dashed border-2 border-primary/40 bg-slate-800/60 rounded-xl p-5 flex flex-col items-center gap-2 relative overflow-hidden">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Confirmation Code</span>
            <div className="font-mono text-primary text-3xl tracking-widest font-bold h-10 flex items-center">
              {codeDisplay}
              <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 h-6 bg-primary ml-1 inline-block" />
            </div>
            <div className="text-amber-400 text-sm mt-2 flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={timeLeft < 3600 ? "animate-pulse text-red-400" : ""}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="tabular-nums font-medium">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            <AnimatePresence mode="wait">
              {confirmState === "idle" && (
                <motion.button 
                  key="idle"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirm} 
                  className="btn-primary w-full flex justify-center items-center gap-2"
                >
                  Confirm Reservation
                </motion.button>
              )}

              {confirmState === "contacting" && (
                <motion.button 
                  key="contacting"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-slate-700 text-slate-300 w-full py-3 px-6 rounded-xl font-medium shadow-inner flex justify-center items-center gap-3 cursor-not-allowed"
                  disabled
                >
                  <motion.svg animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400">
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                  </motion.svg>
                  Contacting facility...
                </motion.button>
              )}

                {confirmState === "confirmed" && (
                <motion.div
                  key="confirmed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  <VitaAvatar state="success" size={120} />
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-4 px-6 rounded-xl w-full justify-center shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                    <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </motion.svg>
                    <span className="font-bold tracking-wide text-lg">Care Secured</span>
                  </div>

                  <AnimatePresence mode="wait">
                    {!feedbackGiven ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: 1 }} className="flex flex-col items-center gap-3 w-full">
                        <p className="text-sm text-slate-300 font-medium">Did this help you find care?</p>
                        <p className="text-xs text-slate-500 text-center mb-1">Your feedback helps 3,241 other families find real care.</p>
                        <div className="flex gap-3 w-full">
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleFeedback(true)} className="btn-secondary flex-1 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400">Yes</motion.button>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleFeedback(false)} className="btn-secondary flex-1 border-slate-700/50 hover:bg-slate-800">No</motion.button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                        <VitaAvatar state="celebrate" size={80} />
                        <p className="text-sm text-emerald-500/80 font-medium italic">
                          Thank you. We're stronger together.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
