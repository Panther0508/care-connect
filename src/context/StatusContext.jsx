import React, { createContext, useState, useCallback } from 'react';

export const StatusContext = createContext();

export const StatusProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showStatus = useCallback((state, title, message, options = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const { duration = 4000 } = options;

    const newToast = {
      id,
      state,
      title,
      message,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissStatus(id);
      }, duration);
    }

    return id;
  }, []);

  const dismissStatus = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <StatusContext.Provider value={{ toasts, showStatus, dismissStatus }}>
      {children}
    </StatusContext.Provider>
  );
};
