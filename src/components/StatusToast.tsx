import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff, Info } from "lucide-react";

const STATE_STYLES = {
  success: {
    bg: "bg-gradient-to-r from-teal-500 to-emerald-600",
    border: "border-teal-400/50",
    icon: CheckCircle,
    iconColor: "text-teal-200",
    ring: "ring-teal-400/30",
    progress: "bg-teal-300",
  },
  error: {
    bg: "bg-gradient-to-r from-red-500 to-rose-600",
    border: "border-red-400/50",
    icon: XCircle,
    iconColor: "text-red-200",
    ring: "ring-red-400/30",
    progress: "bg-red-300",
  },
  offline: {
    bg: "bg-gradient-to-r from-amber-600 to-orange-600",
    border: "border-amber-400/50",
    icon: WifiOff,
    iconColor: "text-amber-200",
    ring: "ring-amber-400/30",
    progress: "bg-amber-300",
  },
  default: {
    bg: "bg-gradient-to-r from-slate-600 to-slate-700",
    border: "border-slate-400/50",
    icon: Info,
    iconColor: "text-slate-200",
    ring: "ring-slate-400/30",
    progress: "bg-slate-300",
  },
  warning: {
    bg: "bg-gradient-to-r from-amber-500 to-yellow-600",
    border: "border-amber-400/50",
    icon: AlertTriangle,
    iconColor: "text-amber-200",
    ring: "ring-amber-400/30",
    progress: "bg-amber-300",
  },
};

export default function StatusToast({ toast, onDismiss }) {
  const styles = STATE_STYLES[toast.state] || STATE_STYLES.default;
  const IconComponent = styles.icon;

  return (
    <motion.div
      initial={{
        y: -20,
        opacity: 0,
        scale: 0.95,
        filter: "blur(4px)",
      }}
      animate={{
        y: 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
      }}
      exit={{
        y: -20,
        opacity: 0,
        scale: 0.95,
        filter: "blur(4px)",
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 0.8,
      }}
      className={`relative overflow-hidden rounded-2xl ${styles.bg} border ${styles.border} shadow-2xl ring-2 ${styles.ring} min-w-[320px] max-w-md backdrop-blur-xl`}
    >
      {/* Progress bar at top */}
      <div
        className="absolute top-0 left-0 h-1 transition-all duration-75 ease-linear"
        style={{
          width: `${toast.progress}%`,
          maxWidth: "100%",
        }}
      >
        <div className={`h-full ${styles.progress} shadow-lg`} />
      </div>

      {/* Content */}
      <div className="flex items-start gap-3 p-4 pr-12">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${styles.iconColor}`}>
          <IconComponent size={24} strokeWidth={2.5} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-lg leading-tight mb-1">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
              {toast.message}
            </p>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Optional subtle glow */}
      <div className={`absolute inset-0 rounded-2xl opacity-20 ${styles.progress} blur-xl`} />
    </motion.div>
  );
}
