import { pipeline } from '@xenova/transformers';
import { getAllFacilities, getAllVectors } from '../lib/idb';
import { searchOnline } from './onlineSearch';

export interface Facility {
  id: string;
  name: string;
  description: string;
  specialties: string[];
  procedure: string[];
  equipment: string[];
  capability: string[];
  address_city: string;
  address_stateOrRegion: string;
  latitude: number | null;
  longitude: number | null;
  trust_score: number;
  contradictions: string[];
  citation: string;
  isNewMatch?: boolean;
  score?: number;
  phone_numbers?: string[];
  email?: string;
  websites?: string[];
  facilityTypeId?: string;
  agent_reasoning?: string[];
  is_medical_desert?: boolean;
  address_line1?: string;
  address_zipOrPostcode?: string;
  numberDoctors?: number | null;
  capacity?: number | null;
}

let extractor: any = null;

export async function initModel() {
  if (extractor) return extractor;
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return extractor;
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}

async function searchOffline(query: string): Promise<Facility[]> {
  const model = await initModel();
  const output = await model(query, { pooling: 'mean', normalize: true });
  const queryVector = Array.from(output.data) as number[];

  const facilities = await getAllFacilities();
  const vectors = await getAllVectors();

  const results = facilities.map(f => {
    const vectorObj = vectors.find(v => v.id === f.id);
    const similarity = vectorObj ? cosineSimilarity(queryVector, vectorObj.vector) : 0;
    
    return {
      ...f,
      trust_score: 50, // Default for offline
      contradictions: [],
      citation: f.description ? f.description.slice(0, 200) + (f.description.length > 200 ? '...' : '') : '',
      score: similarity,
      phone_numbers: ["+91 (Internal Only)"] // Mock for offline
    };
  });

  return results
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);
}

export async function searchCare(query: string): Promise<Facility[]> {
  if (!query.trim()) return [];

  // TRY ONLINE FIRST
  if (navigator.onLine) {
    try {
      const onlineResults = await searchOnline(query);
      if (onlineResults && onlineResults.length > 0) {
        return onlineResults; // rich Gemini results
      }
    } catch (e) {
      console.warn('Online search failed, falling back to offline:', (e as Error).message);
    }
  }

  // FALLBACK TO OFFLINE (Transformers.js)
  return searchOffline(query);
}

export async function getFacilityById(id: string): Promise<Facility | undefined> {
  const facilities = await getAllFacilities();
  return facilities.find(f => f.id === id);
}

export function useModelStatus() {
  // Keep for compatibility
  return { loaded: !!extractor, loading: false, error: null };
}

export async function getImpactStats() {
  const facilities = await getAllFacilities();
  return {
    watching: 3241,
    connections: 892,
    facilities: facilities.length,
    contradictionsFlagged: 124, // Mock
    medicalDesertsIdentified: 12 // Mock
  };
}
