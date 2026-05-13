import { pipeline, env } from '@huggingface/transformers';
import { getAllFacilities, getAllVectors } from '../lib/idb';
import { searchOnline } from './onlineSearch';
import { meshOrchestrator } from './meshOrchestrator';

// Embedding model configuration — relies on global env set by modelLoader
// No local overrides; inherit allowRemoteModels/allowLocalSettings from modelLoader
env.useBrowserCache = true;

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
let extractorError = null;
let extractorCooldownUntil = 0; // Cooldown timestamp after permanent failure

// Simple keyword-based embedding fallback (offline-safe)
function keywordEmbed(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const features: Record<number, number> = {};
  words.forEach((w) => {
    const hash = [...w].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    features[Math.abs(hash) % 384] = (features[Math.abs(hash) % 384] || 0) + 1;
  });
  const vec = new Array(384).fill(0);
  Object.entries(features).forEach(([idx, val]) => { vec[parseInt(idx)] = Math.min(parseInt(val), 5); });
  const mag = Math.sqrt(vec.reduce((a, b) => a + b * b, 0)) || 1;
  return vec.map(v => v / mag);
}

export async function initModel() {
  if (extractor) return extractor;

  // Cooldown check after permanent failure
  if (extractorError && extractorCooldownUntil && Date.now() < extractorCooldownUntil) {
    console.log('aiSearch embedder in cooldown, returning null');
    return null;
  }
  if (extractorError && extractorCooldownUntil && Date.now() >= extractorCooldownUntil) {
    extractorError = null; // reset to allow retry
  }

  const maxAttempts = 3;
  let lastErr = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Loading embedding model (attempt ${attempt}/${maxAttempts}): Xenova/all-MiniLM-L6-v2`);
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      return extractor;
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️ Embedder attempt ${attempt} failed:`, err?.message || err);
      if (attempt < maxAttempts) {
        const delay = attempt === 1 ? 2000 : attempt === 2 ? 4000 : 6000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  extractorError = lastErr;
  extractor = null;
  extractorCooldownUntil = Date.now() + 20 * 60 * 1000; // 20 minutes cooldown
  console.error('❌ Embedder failed after 3 attempts, using keyword fallback');
  return null;
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
  let queryVector: number[];
  if (!model) {
    queryVector = keywordEmbed(query);
  } else {
    const output = await model(query, { pooling: 'mean', normalize: true });
    queryVector = Array.from(output.data) as number[];
  }

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

  // Log search to mesh (privacy-preserving – only the term, no user identity)
  try {
    meshOrchestrator.recordSearch(query);
  } catch (err) {
    console.warn('Failed to record search in mesh:', err);
  }

   // TRY ONLINE FIRST
   if (navigator.onLine) {
     try {
       const onlineResults = await searchOnline(query);
       if (onlineResults && onlineResults.length > 0) {
         return onlineResults; // rich Gemini results
       }
     } catch {
       // Fallback to offline
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
