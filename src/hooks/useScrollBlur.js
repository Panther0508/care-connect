import { useState, useEffect } from 'react';

/**
 * Custom hook that returns a blur value based on scroll position.
 * Baseline: 12px, increases up to 24px when near the top of the viewport.
 * @returns {number} blur value in pixels
 */
export function useScrollBlur() {
  const [blur, setBlur] = useState(12);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      // Calculate blur: 12px at bottom, up to 24px at top (when scrollTop is 0)
      // We'll map scrollTop from 0 to 500px to blur from 24px to 12px
      const maxScrollForEffect = 500; // pixels
      let newBlur = 24 - (scrollTop / maxScrollForEffect) * 12; // 24 at top, 12 at 500px
      // Clamp between 12 and 24
      newBlur = Math.max(12, Math.min(24, newBlur));
      setBlur(newBlur);
    };

    window.addEventListener('scroll', handleScroll);
    // Initial call
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return blur;
}