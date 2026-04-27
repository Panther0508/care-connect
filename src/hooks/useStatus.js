import { useContext } from 'react';
import { StatusContext } from '../context/StatusContext';

export const useStatus = () => {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};
