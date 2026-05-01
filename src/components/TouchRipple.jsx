import { useState } from 'react';

/**
 * TouchRipple component that creates a ripple effect from touch point.
 * To be used as a child of an element with position: relative.
 * Assumes the parent has the .glass-card class and will handle the ripple-active state.
 * 
 * Usage:
 * <div className="relative glass-card" onTouchStart={handleTouchStart}>
 *   <TouchRipple />
 *   {/* content */}
 * </div>
 * 
 * The TouchRipple component will create a ripple effect when the parent receives a touchstart event.
 * It expects the parent to set the CSS custom properties --ripple-x, --ripple-y, and --ripple-opacity
 * and toggle the 'ripple-active' class.
 */
export function TouchRipple() {
  const [ripple, setRipple] = useState({
    x: 0,
    y: 0,
    opacity: 0,
    active: false
  });

  const handleTouchStart = (e) => {
    // Prevents scrolling when touching the ripple area
    e.stopPropagation();

    const touch = e.touches[0];
    const parent = e.currentTarget;
    const rect = parent.getBoundingClientRect();

    // Calculate position relative to the parent
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setRipple({
      x: (x / rect.width) * 100, // percentage
      y: (y / rect.height) * 100, // percentage
      opacity: 0.3,
      active: true
    });

    // We'll deactivate after the animation ends (400ms)
    setTimeout(() => {
      setRipple(prev => ({ ...prev, active: false }));
    }, 400);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      onTouchStart={handleTouchStart}
      style={{
        '--ripple-x': `${ripple.x}%`,
        '--ripple-y': `${ripple.y}%`,
        '--ripple-opacity': ripple.opacity
      }}
      className={ripple.active ? 'ripple-active' : ''}
    >
      {/* The ripple effect is created by the ::after pseudo-element in the .glass-card class */}
    </div>
  );
}