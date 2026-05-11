import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  depth?: 'none' | 'tight' | 'loose';
}

export default function GlassCard({
  children,
  className = '',
  hover = true,
  onClick,
  depth = 'tight',
}: GlassCardProps) {
  const interactive = onClick ? 'cursor-pointer active:scale-[0.98]' : '';
  const hoverClass = hover ? 'hover-scale-103 shadow-glass-hover' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      data-depth={depth}
      className={`glass-card ${interactive} ${hoverClass} ${className}`}
    >
      {children}
    </motion.div>
  );
}
