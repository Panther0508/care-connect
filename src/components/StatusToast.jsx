import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusContext } from '../context/StatusContext';
import VitaAvatar from './VitaAvatar';

export const StatusToast = ({ state, title, message, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)', transition: { duration: 0.2 } }}
      className="glass-card p-4 flex items-center gap-4 min-w-[320px] max-w-md shadow-[0_20px_40px_rgba(0,0,0,0.4)] border-white/10"
      onClick={onDismiss}
    >
      <div className="flex-shrink-0 bg-slate-800/50 rounded-full p-1 border border-white/5">
        <VitaAvatar state={state} size={56} />
      </div>
      
      <div className="flex-grow">
        <h4 className="text-slate-100 font-bold text-sm leading-tight">{title}</h4>
        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{message}</p>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="text-slate-500 hover:text-slate-300 transition-colors p-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </motion.div>
  );
};

export const StatusToastContainer = () => {
  const { toasts, dismissStatus } = useContext(StatusContext);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <StatusToast 
              {...toast} 
              onDismiss={() => dismissStatus(toast.id)} 
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
