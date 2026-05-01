import { motion } from 'framer-motion';
import { useLiquidGlass } from '../hooks/useLiquidGlass';

interface LiquidGlassCardProps {
  className?: string;
  children: React.ReactNode;
  depth?: 'loose' | 'tight' | 'none';
}

/**
 * Premium Liquid Glass 2.0 Card component
 * Implements scroll-responsive blur, cursor-tracking refraction (desktop),
 * and touch-triggered ripple (mobile) effects
 */
export function LiquidGlassCard({
  className = '',
  children,
  depth = 'tight',
}: LiquidGlassCardProps) {
  const { elementRef, glassStyles } = useLiquidGlass({
    scrollBlur: true,
    cursorRefraction: true,
    touchRipple: true,
  });

  return (
    <motion.div
      ref={elementRef}
      data-depth={depth}
      className={`glass-card ${className}`}
      style={{
        ...glassStyles,
        // Apply ambient occlusion shadow based on depth
        '--glass-shadow': 
          depth === 'loose' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' :
          depth === 'tight' ? '0 8px 20px -4px rgba(0, 0, 0, 0.3)' :
          '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      {children}
    </motion.div>
  );
}