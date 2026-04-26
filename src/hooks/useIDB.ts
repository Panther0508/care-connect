import { useEffect, useState } from 'react';
import {
  getAllFacilities,
  getAllVectors,
  storeFacilities,
  storeVectors,
} from '../lib/idb';

export function useIDB() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initIDB() {
      try {
        const initialized = localStorage.getItem('caresentinel_offline_loaded');
        if (initialized === 'true') {
          setReady(true);
        } else {
          const response = await fetch('/facilities_offline.json');
          if (!response.ok) {
            throw new Error(`Failed to load offline data: ${response.status}`);
          }
          const data = await response.json();

          // Separate facilities (without embedding) and vectors (id + embedding)
          const facilitiesToStore = data.map(({ embedding, ...facility }) => facility);
          const vectorsToStore = data.map((item: any) => ({
            id: item.id,
            vector: item.embedding
          }));

          // Store in IDB
          await Promise.all([
            storeFacilities(facilitiesToStore),
            storeVectors(vectorsToStore),
          ]);

          localStorage.setItem('caresentinel_offline_loaded', 'true');

          if (!cancelled) {
            setReady(true);
          }
        }
      } catch (err) {
        console.error('IDB Init failed:', err);
        if (!cancelled) {
          setError(err.message);
          setReady(false);
        }
      }
    }

    initIDB();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}