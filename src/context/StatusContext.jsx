import React, { createContext, useState, useCallback, useRef } from 'react';

export const StatusContext = createContext();

export const StatusProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const progressIntervals = useRef({});

  const dismissStatus = useCallback((id) => {
    if (progressIntervals.current[id]) {
      clearInterval(progressIntervals.current[id]);
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
          clearInterval(progressIntervals.current[oldest.id]);
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

    progressIntervals.current[id] = interval;

    if (duration > 0) {
      const timeout = setTimeout(() => {
        dismissStatus(id);
      }, duration);
      // Store timeout for cleanup if needed
      progressIntervals.current[id] = { interval, timeout };
    }

    return id;
  }, [dismissStatus]);

  return (
    <StatusContext.Provider value={{ toasts, showStatus, dismissStatus }}>
      {children}
    </StatusContext.Provider>
  );
};
