import { useState, useEffect } from 'react';
import { getSavedNeeds, registerNeed, removeNeed as removeIDBNeed } from '../services/needWatcher';

export interface Need {
  text: string;
  timestamp: number;
  active: boolean;
}

export function useSavedNeeds() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNeeds = async () => {
    setLoading(true);
    try {
      const data = await getSavedNeeds();
      setNeeds(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeeds();
  }, []);

  const addNeed = async (text: string) => {
    const newNeed = await registerNeed(text);
    setNeeds(prev => [newNeed, ...prev]);
  };

  const removeNeed = async (index: number) => {
    const needToRemove = needs[index];
    await removeIDBNeed(needToRemove.timestamp);
    setNeeds(prev => prev.filter((_, i) => i !== index));
  };

  return { needs, loading, addNeed, removeNeed };
}