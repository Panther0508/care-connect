import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setActiveUser, getCurrentHealthState, clearActiveUser } from '../services/healthGraph';
import { getItem } from '../lib/idb';
import { decryptPassphrase } from '../lib/encryption';

const ENCRYPTED_PASSPHRASE_KEY = 'vita_user_passphrase';

export function useHealthGraph() {
  const { user } = useAuth();
  const [conditions, setConditions] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHealthData = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Retrieve encrypted passphrase from IndexedDB
      const encryptedPassphrase = await getItem<string>(ENCRYPTED_PASSPHRASE_KEY);
      if (!encryptedPassphrase) {
        // First time: use demo passphrase
        await setActiveUser(userId, 'vita-demo-2026');
      } else {
         // Decrypt to get actual passphrase
         const passphrase = decryptPassphrase(encryptedPassphrase);
        await setActiveUser(userId, passphrase);
      }

      const healthState = getCurrentHealthState();
      setConditions(healthState.conditions || []);
      setMedications(healthState.medications || []);
      setAllergies(healthState.allergies || []);
      setEncounters(healthState.encounters || []);
    } catch (err) {
      console.error('Failed to load health graph:', err);
      setError('Failed to load health data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadHealthData(user.id);
      return () => clearActiveUser();
    }
  }, [user, loadHealthData]);

  return {
    healthGraph: { conditions, medications, allergies, encounters },
    conditions,
    medications,
    allergies,
    encounters,
    isLoading,
    error,
    refresh: () => user && loadHealthData(user.id),
  };
}
