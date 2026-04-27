import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  borderColor?: string;
  glowColor?: string;
}

export default function GlassCard({
  children,
  className = '',
  hover = true,
  onClick,
  borderColor = 'border-white/10',
  glowColor = 'shadow-glow-primary',
}: GlassCardProps) {
  const baseStyles = 'bg-surface/60 backdrop-blur-xl border rounded-2xl transition-all duration-300';
  const hoverStyles = hover
    ? 'hover:border-teal-500/30 hover:bg-slate-800/70 hover:shadow-lg'
    : '';
  const interactive = onClick ? 'cursor-pointer active:scale-[0.98]' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -2 } : undefined}
      onClick={onClick}
      className={`${baseStyles} ${borderColor} ${hoverStyles} ${glowColor} ${interactive} ${className}`}
    >
      {children}
    </motion.div>
  );
}
