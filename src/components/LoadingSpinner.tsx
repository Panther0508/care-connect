import { motion } from "framer-motion";
import VitaAvatar from "./VitaAvatar";

export default function LoadingSpinner({ size = 80, className = "" }) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Vita loading avatar in center */}
      <div className="relative z-10">
        <VitaAvatar state="loading" size={size * 0.5} />
      </div>

      {/* Rotating teal ring - orbit animation */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-teal-400/60 border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Optional outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-teal-300/30"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
