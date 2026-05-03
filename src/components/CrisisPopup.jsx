// src/components/CrisisPopup.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import vitaAvatar from '../components/VitaAvatar.jsx';

/**
 * Crisis Popup - Full-screen overlay for crisis situations
 * Cannot be dismissed by clicking outside
 */
export default function CrisisPopup({ visible, riskLevel, matchedPattern, onDismiss, userProfile }) {
  if (!visible) return null;

  // Get emergency numbers based on user profile
  const countryCode = userProfile?.countryCode || userProfile?.preferredCountry || 'ng';
  const emergencyNumbers = getEmergencyNumbers(countryCode);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: 'spring' }}
            className="glass-card rounded-3xl p-8 max-w-md w-full mx-auto text-center relative"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(30, 41, 59, 0.9)'
            }}
          >
            {/* Pulsing alert ring */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full"
              style={{
                border: '3px solid rgba(234, 179, 8, 0.5)',
                borderTopColor: 'transparent'
              }}
            />

            {/* Alert Avatar */}
            <div className="relative mb-6 flex justify-center">
              <img
                src="/avatars/vita-alert.png"
                alt="Alert"
                className="w-24 h-24 rounded-full object-contain"
                loading="lazy"
                onError={(e) => { e.target.src = '/avatars/default.png'; }}
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(234, 179, 8, 0.4))'
                }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-slate-100 mb-3">
                We're here for you
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                It looks like you're going through something really difficult right now. You are not alone. Please reach out — there are people who want to help.
              </p>

              {/* Action Buttons */}
              <div className="space-y-3 mb-4">
                {/* Call Emergency Services */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    window.location.href = `tel:${emergencyNumbers.emergency}`;
                  }}
                  className="w-full py-4 px-6 rounded-xl font-medium text-white text-sm transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <span role="img" aria-label="phone">📞</span>
                  Call Emergency Services {emergencyNumbers.emergency}
                </motion.button>

                {/* Crisis Counselor */}
                {emergencyNumbers.crisisHotline && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (/^\d/.test(emergencyNumbers.crisisHotline)) {
                        window.location.href = `tel:${emergencyNumbers.crisisHotline.replace(/\D/g, '')}`;
                      } else if (emergencyNumbers.crisisHotline.startsWith('http')) {
                        window.open(emergencyNumbers.crisisHotline, '_blank');
                      } else {
                        window.open(`tel:${emergencyNumbers.crisisHotline.replace(/[^\d+]/g, '')}`, '_blank');
                      }
                    }}
                    className="w-full py-4 px-6 rounded-xl font-medium text-white text-sm transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #d97706, #b45309)',
                      boxShadow: '0 4px 20px rgba(217, 119, 6, 0.3)'
                    }}
                  >
                    <span role="img" aria-label="heart">💚</span>
                    Talk to a Crisis Counselor
                  </motion.button>
                )}

                {/* Emergency Contact */}
                <EmergencyContactButton userProfile={userProfile} />
              </div>

              {/* Close link */}
              <button
                onClick={onDismiss}
                className="text-slate-400 text-xs underline hover:text-slate-300 transition-colors"
              >
                Continue to App
              </button>

              <p className="text-slate-500 text-[10px] mt-2">
                You can close this and continue using VitaChain whenever you're ready
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EmergencyContactButton({ userProfile }) {
  const handleClick = () => {
    const iceContact = userProfile?.emergencyContact || userProfile?.iceContact;
    if (iceContact && iceContact.phone) {
      window.location.href = `tel:${iceContact.phone.replace(/\D/g, '')}`;
    } else {
      alert('No emergency contact saved. Please add one in Settings.');
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="w-full py-4 px-6 rounded-xl font-medium text-white text-sm transition-all flex items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(135deg, #0d9488, #0f766e)',
        boxShadow: '0 4px 20px rgba(13, 148, 136, 0.3)'
      }}
    >
      <span role="img" aria-label="person">👤</span>
      Contact My Emergency Person
    </motion.button>
  );
}

function getEmergencyNumbers(countryCode) {
  const normalizedCode = (countryCode || '').toString().toLowerCase();

  const countryData = {
    ng: { emergency: '112', crisisHotline: '+234 806 210 6493' },
    ke: { emergency: '999', crisisHotline: '+254 20 3000378' },
    gh: { emergency: '112', crisisHotline: '+233 244 846 721' },
    za: { emergency: '10111', crisisHotline: '0800 567 567' },
    tz: { emergency: '112', crisisHotline: '+255 22 2115158' },
    ug: { emergency: '112', crisisHotline: '0800 211 211' },
    rw: { emergency: '112', crisisHotline: '+250 788 383 405' },
    in: { emergency: '112', crisisHotline: '+91 98204 66726' },
  };

  return countryData[normalizedCode] || { emergency: '112', crisisHotline: null };
}