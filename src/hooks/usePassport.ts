import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getPassportShares, getPassportScans, PassportShare, PassportScan } from '../lib/idb';
import { initPassport } from '../services/passport';

export function usePassport() {
  const { user } = useAuth();
  const [shares, setShares] = useState<PassportShare[]>([]);
  const [scans, setScans] = useState<PassportScan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Initialize passport for this user
        await initPassport(user.id, 'vita-demo-2026'); // Later use actual passphrase

        // Load shares and scans
        const userShares = await getPassportShares(user.id);
        const userScans = await getPassportScans(user.id);
        setShares(userShares);
        setScans(userScans);
      } catch (error) {
        console.error('Failed to load passport data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const refresh = async () => {
    if (!user) return;
    const userShares = await getPassportShares(user.id);
    const userScans = await getPassportScans(user.id);
    setShares(userShares);
    setScans(userScans);
  };

  return {
    shares,
    scans,
    recentShares: shares.slice(0, 5),
    recentScans: scans.slice(0, 5),
    isLoading,
    refresh,
  };
}
