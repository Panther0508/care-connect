import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';

export const StatusContext = createContext();

export const StatusProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const progressIntervals = useRef({});

  // Clear all intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(progressIntervals.current).forEach((timer) => {
        if (timer) {
          clearInterval(timer.interval);
          clearTimeout(timer.timeout);
        }
      });
      progressIntervals.current = {};
    };
  }, []);

  const dismissStatus = useCallback((id) => {
    if (progressIntervals.current[id]) {
      clearInterval(progressIntervals.current[id].interval);
      clearTimeout(progressIntervals.current[id].timeout);
      delete progressIntervals.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showStatus = useCallback((state, title, message, options = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const { duration = 4000 } = options;

    // Limit to 3 toasts - remove oldest if limit exceeded
    setToasts((prev) => {
      const updated = [...prev, { id, state, title, message, duration, progress: 100 }];
      if (updated.length > 3) {
        const oldest = updated[0];
        if (progressIntervals.current[oldest.id]) {
          clearInterval(progressIntervals.current[oldest.id].interval);
          clearTimeout(progressIntervals.current[oldest.id].timeout);
          delete progressIntervals.current[oldest.id];
        }
        return updated.slice(1);
      }
      return updated;
    });

    // Progress bar decrements every 40ms (100% over 4s = 4000ms)
    const interval = setInterval(() => {
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                progress: Math.max(0, t.progress - (100 / (duration / 40))),
              }
            : t
        )
      );
    }, 40);

    let timeout = null;
    if (duration > 0) {
      timeout = setTimeout(() => {
        dismissStatus(id);
      }, duration);
    }

    // Store both timer IDs for cleanup
    progressIntervals.current[id] = { interval, timeout };

    return id;
  }, [dismissStatus]);

  return (
    <StatusContext.Provider value={{ toasts, showStatus, dismissStatus }}>
      {children}
    </StatusContext.Provider>
  );
};
