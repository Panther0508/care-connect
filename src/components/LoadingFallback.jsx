import { motion } from 'framer-motion';
import VitaAvatar from './VitaAvatar';

export default function LoadingFallback({ message = 'Loading...', showProgress = false }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center space-y-6"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 mx-auto"
          >
            <VitaAvatar state="loading" size={80} />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-teal-500/30"
          />
        </div>
        <p className="text-slate-300 font-medium">{message}</p>
        {showProgress && (
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
