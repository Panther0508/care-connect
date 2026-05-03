import { useState, useEffect, useRef } from 'react';

/**
 * useSkeletonGuard - Controls skeleton loading display timing.
 *
 * - Returns 'idle' initially.
 * - After 200ms of isLoading=true, transitions to 'loading'.
 * - Once 'loading', stays for at least 500ms (prevents flicker).
 * - After 5s of isLoading=true, transitions to 'error'.
 *
 * @param {boolean} isLoading - Whether data is still loading.
 * @returns {'idle' | 'loading' | 'ready' | 'error'} state
 */
export function useSkeletonGuard(isLoading) {
  const [state, setState] = useState(isLoading ? 'idle' : 'ready');
  const loadingStartRef = useRef(null);
  const showStartRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      // Start tracking when loading began
      if (!loadingStartRef.current) {
        loadingStartRef.current = Date.now();
      }

      // After 200ms delay, show skeleton
      const delayTimer = setTimeout(() => {
        if (isLoading) {
          setState('loading');
          showStartRef.current = Date.now();
        }
      }, 200);

      // After 5s, transition to error
      const errorTimer = setTimeout(() => {
        setState(prev => prev === 'loading' ? 'error' : prev);
      }, 5000);

      return () => {
        clearTimeout(delayTimer);
        clearTimeout(errorTimer);
      };
    } else {
      // Loading finished
      if (showStartRef.current) {
        const elapsed = Date.now() - showStartRef.current;
        const remaining = Math.max(0, 500 - elapsed);

        // Keep skeleton visible for minimum 500ms
        const minTimer = setTimeout(() => {
          setState('ready');
          loadingStartRef.current = null;
          showStartRef.current = null;
        }, remaining);

        return () => clearTimeout(minTimer);
      } else {
        // Never showed skeleton — go straight to ready
        setState('ready');
        loadingStartRef.current = null;
      }
    }
  }, [isLoading]);

  return state;
}

export default useSkeletonGuard;
