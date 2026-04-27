import { useEffect, useState } from 'react';
import {
  getAllFacilities,
  getAllVectors,
  storeFacilities,
  storeVectors,
} from '../lib/idb';
import { initMeshOrchestrator } from '../services/meshOrchestrator';

export function useIDB() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initIDB() {
      try {
        const initialized = localStorage.getItem('caresentinel_offline_loaded');
        if (initialized === 'true') {
          await initMeshOrchestrator();
          if (!cancelled) setReady(true);
        } else {
          const response = await fetch('/facilities_offline.json');
          if (!response.ok) {
            throw new Error(`Failed to load offline data: ${response.status}`);
          }
          const data = await response.json();

          const facilitiesToStore = data.map(({ embedding, ...facility }) => facility);
          const vectorsToStore = data.map((item: any) => ({
            id: item.id,
            vector: item.embedding,
          }));

          await Promise.all([
            storeFacilities(facilitiesToStore),
            storeVectors(vectorsToStore),
          ]);

          localStorage.setItem('caresentinel_offline_loaded', 'true');

          await initMeshOrchestrator();

          if (!cancelled) setReady(true);
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

  const storeSearch = async (term: string) => {
    // Deprecated: use meshOrchestrator.recordSearch instead
    console.warn('storeSearch is deprecated; use meshOrchestrator.recordSearch');
  };

  return { ready, error, storeSearch };
}
