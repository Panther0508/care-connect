import { useState, useEffect } from 'react';

/**
 * Custom hook that tracks mouse position and sets CSS custom properties on a ref element.
 * Only works on non-touch devices.
 * @param {React.RefObject<HTMLElement>} ref - The ref to the element to update
 * @returns {void}
 */
export function useMousePosition(ref) {
  useEffect(() => {
    if (!ref.current) return;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      
      // Calculate position relative to the element (0-100%)
      const xPercent = ((clientX - left) / width) * 100;
      const yPercent = ((clientY - top) / height) * 100;
      
      // Clamp to 0-100
      const clampedX = Math.max(0, Math.min(100, xPercent));
      const clampedY = Math.max(0, Math.min(100, yPercent));
      
      ref.current.style.setProperty('--cursor-x', `${clampedX}%`);
      ref.current.style.setProperty('--cursor-y', `${clampedY}%`);
    };

    // Only add listener if not a touch device
    if (!('ontouchstart' in window)) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (!('ontouchstart' in window)) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      // Clean up the custom properties
      if (ref.current) {
        ref.current.style.removeProperty('--cursor-x');
        ref.current.style.removeProperty('--cursor-y');
      }
    };
  }, [ref]);
}