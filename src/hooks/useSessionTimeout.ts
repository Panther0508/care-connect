import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Custom hook that resets a timer on specified user activities.
 * Useful for implementing session timeouts that reset on user interaction.
 *
 * @param timeoutMs - The timeout duration in milliseconds
 * @param onTimeout - Callback function to execute when timeout occurs
 * @param activities - Array of DOM events that should reset the timer (default: ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'])
 * @param warningMs - Optional warning threshold in milliseconds. If provided, onWarning is called when remaining time drops below this value.
 * @param onWarning - Optional callback when warning threshold is crossed
 */
export function useSessionTimeout(
  timeoutMs: number,
  onTimeout: () => void,
  activities: string[] = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'],
  warningMs?: number,
  onWarning?: () => void
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const [hasWarned, setHasWarned] = useState(false);
  const hasWarnedRef = useRef(false);

  /**
   * Resets the timeout timer and updates last activity timestamp
   */
  const resetTimer = useCallback(() => {
    // Update last activity timestamp
    lastActivityRef.current = Date.now();

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }, [timeoutMs, onTimeout]);

  /**
   * Handles activity events by resetting the timer
   */
  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Set up event listeners for specified activities
  useEffect(() => {
    // Initialize timer on mount
    resetTimer();

    // Add event listeners for each activity
    activities.forEach((activity) => {
      window.addEventListener(activity, handleActivity);
    });

    // Cleanup on unmount
    return () => {
      // Clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Remove event listeners
      activities.forEach((activity) => {
        window.removeEventListener(activity, handleActivity);
      });
    };
  }, [activities, handleActivity, resetTimer]);

  /**
   * Check if warning threshold has been crossed and trigger warning callback
   */
  useEffect(() => {
    if (!warningMs || !onWarning) return;

    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      const remaining = timeoutMs - idleTime;

      if (remaining <= warningMs && remaining > 0 && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        setHasWarned(true);
        onWarning();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeoutMs, warningMs, onWarning]);

  /**
   * Reset warning state when user becomes active again
   */
  useEffect(() => {
    if (!hasWarned) return;

    // Clear warning flag when activity resets timer
    const check = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime < warningMs! - 5000) {
        // Buffer of 5 seconds
        hasWarnedRef.current = false;
        setHasWarned(false);
      }
    }, 1000);

    return () => clearInterval(check);
  }, [hasWarned, warningMs]);

  /**
   * Returns the time since last activity in milliseconds
   */
  const getIdleTime = useCallback(() => {
    return Date.now() - lastActivityRef.current;
  }, []);

  /**
   * Returns the remaining time before timeout in milliseconds
   */
  const getRemainingTime = useCallback(() => {
    const idleTime = getIdleTime();
    return Math.max(0, timeoutMs - idleTime);
  }, [getIdleTime, timeoutMs]);

  /**
   * Manually reset the timeout (useful for external triggers)
   */
  const manualReset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return {
    resetTimer: manualReset,
    getIdleTime,
    getRemainingTime,
    isIdle: getIdleTime() >= timeoutMs,
    hasWarned,
  };
}