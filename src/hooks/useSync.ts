import { useEffect, useState } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { storeFacilities, storeVectors } from '../lib/idb';
import { checkForAlerts } from '../services/needWatcher';

export function useSync() {
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  useEffect(() => {
    async function doSync() {
      if (!isOnline) return;
      
      const ls = localStorage.getItem('lastSynced');
      const lastSynced = ls ? parseInt(ls, 10) : 0;
      
      // Sync if it's been more than 1 hour or we're just coming online
      if (Date.now() - lastSynced > 3600000 || lastSynced === 0) {
        try {
          setSyncing(true);
          console.log(`Syncing facilities since ${lastSynced}...`);
          
          const apiUrl = import.meta.env.VITE_API_URL || '';
          if (!apiUrl) {
            console.error('VITE_API_URL is not set');
            setSyncing(false);
            return;
          }
          
          const res = await fetch(`${apiUrl}/api/facilities?since=${lastSynced}`);
          if (!res.ok) throw new Error("Failed to fetch from API");
          
          const newFacilities = await res.json();
          
          if (newFacilities && newFacilities.length > 0) {
            console.log(`Found ${newFacilities.length} new/updated facilities.`);
            
            const facilities = newFacilities.map((f: any) => {
              const { vector, ...rest } = f;
              return rest;
            });
            const vectors = newFacilities.map((f: any) => ({
              id: f.id,
              vector: f.vector
            }));

            await storeFacilities(facilities);
            await storeVectors(vectors);
            
            // Check if any new alerts are generated
            await checkForAlerts();
          }
          
          const now = Date.now();
          localStorage.setItem('lastSynced', now.toString());
          setLastSyncTime(now);
          setSyncing(false);
          
        } catch (err) {
          console.error("Sync failed", err);
          setSyncing(false);
        }
      }
    }

    doSync();
    
    // Also set up a periodic sync every 15 minutes when online
    const interval = setInterval(doSync, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOnline]);

  return { syncing, lastSyncTime };
}