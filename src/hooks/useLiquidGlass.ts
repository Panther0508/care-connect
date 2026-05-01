import { useEffect, useState, useRef, MutableRefObject } from 'react';

interface UseLiquidGlassOptions {
  /**
   * Whether to enable scroll-responsive blur (default: true)
   */
  scrollBlur?: boolean;
  /**
   * Whether to enable cursor-tracking refraction (desktop only, default: true)
   */
  cursorRefraction?: boolean;
  /**
   * Whether to enable touch-triggered ripple (mobile only, default: true)
   */
  touchRipple?: boolean;
}

/**
 * Hook to apply Liquid Glass 2.0 effects to an element.
 * Returns a ref to attach to the element and an object with dynamic style properties.
 */
export function useLiquidGlass(options: UseLiquidGlassOptions = {}) {
  const {
    scrollBlur = true,
    cursorRefraction = true,
    touchRipple = true,
  } = options;

  const elementRef = useRef<MutableRefObject<HTMLElement | null>>(null);
  const [scrollBlurValue, setScrollBlurValue] = useState(12); // in px
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [touchRippleStyle, setTouchRippleStyle] = useState<{ x: number; y: number; opacity: number } | null>(null);

  // Scroll-responsive blur: adjust blur based on element's position in viewport
  useEffect(() => {
    if (!scrollBlur) return;

    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollTop = window.pageYOffset;

      // Calculate how far the element is from the top of the viewport
      const distanceFromTop = rect.top + scrollTop;
      const scrollProgress = scrollTop / (document.body.scrollHeight - viewportHeight);

      // We want blur to increase as we scroll up (element moves up in viewport)
      // When element is at the top of viewport, blur should be max (24px)
      // When element is at the bottom, blur should be min (12px)
      // We'll map the element's vertical position in the viewport to blur value
      const elementViewportTop = rect.top;
      const blur = 12 + (12 * (1 - Math.max(0, Math.min(1, (elementViewportTop + viewportHeight / 2) / viewportHeight))));
      setScrollBlurValue(blur);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll(); // initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [scrollBlur]);

  // Cursor-tracking refraction (desktop only)
  useEffect(() => {
    if (!cursorRefraction) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top;  // y position within the element

      setCursorPosition({ x, y });
    };

    const handleMouseLeave = () => {
      setCursorPosition(null);
    };

    elementRef.current?.addEventListener('mousemove', handleMouseMove);
    elementRef.current?.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      elementRef.current?.removeEventListener('mousemove', handleMouseMove);
      elementRef.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorRefraction]);

  // Touch-triggered ripple (mobile only)
  useEffect(() => {
    if (!touchRipple) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Create a ripple effect that starts at touch point and fades out
      setTouchRippleStyle({ x, y, opacity: 0.3 });

      // Clear the ripple after a short duration
      const timeout = setTimeout(() => {
        setTouchRippleStyle(null);
      }, 600); // matches the ripple animation duration

      return () => clearTimeout(timeout);
    };

    elementRef.current?.addEventListener('touchstart', handleTouchStart);

    return () => {
      elementRef.current?.removeEventListener('touchstart', handleTouchStart);
    };
  }, [touchRipple]);

  // Compute the dynamic styles
  const glassStyles = {
    backdropBlur: `${scrollBlurValue}px`,
    '--cursor-x': cursorPosition ? `${cursorPosition.x}px` : '0',
    '--cursor-y': cursorPosition ? `${cursorPosition.y}px` : '0',
    '--ripple-x': touchRippleStyle ? `${touchRippleStyle.x}px` : '0',
    '--ripple-y': touchRippleStyle ? `${touchRippleStyle.y}px` : '0',
    '--ripple-opacity': touchRippleStyle ? `${touchRippleStyle.opacity}` : '0',
  };

  return {
    elementRef,
    glassStyles,
  };
}