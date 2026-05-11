import { motion } from 'framer-motion';
import MagnifyingLoader from './MagnifyingLoader';

export default function LoadingFallback({ message = 'Loading...', showProgress = false }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0F172A]">
      {/* Background Ambient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="float-orb float-orb-1 w-96 h-96 bg-teal-500/10 top-[-10%] left-[-10%]" />
        <div className="float-orb float-orb-2 w-96 h-96 bg-cyan-500/10 bottom-[-10%] right-[-10%]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="glass-card p-12 rounded-[2.5rem] flex flex-col items-center gap-8 shadow-2xl border-white/5">
          <div className="relative">
            <MagnifyingLoader size={80} />
            {/* Subtle glow behind loader */}
            <div className="absolute inset-0 bg-teal-400/20 blur-3xl rounded-full -z-10 animate-pulse" />
          </div>

          <div className="space-y-3 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-white">
              <span className="gradient-text-shimmer">VitaChain</span>
            </h3>
            <p className="text-slate-400 font-medium animate-pulse">{message}</p>
          </div>

          {showProgress && (
            <div className="w-64 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500 bg-[length:200%_auto]"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  x: ['-100%', '100%']
                }}
                transition={{ 
                  backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" },
                  x: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
              />
            </div>
          )}
        </div>

        {/* Security / Privacy reassurance at bottom */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex items-center gap-2 text-slate-500 text-sm font-medium"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          End-to-End Encrypted & Privacy Guarded
        </motion.div>
      </motion.div>
    </div>
  );
}

