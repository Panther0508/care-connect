import { kv } from '@vercel/kv';

const GEMINI_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string required' });
    }

    // 1. Get candidate facilities from KV (fast pre-filter)
    const allFacilities = await kv.get('facilities');
    if (!allFacilities || !Array.isArray(allFacilities)) {
      return res.status(500).json({ error: 'Facility data not available' });
    }

    // 2. Build a condensed context for Gemini (top 30 candidates by keyword match)
    const candidates = preFilterByKeywords(query, allFacilities).slice(0, 30);
    const context = candidates.map((f, i) => ({
      id: i,
      name: f.name,
      city: f.address_city || 'Unknown',
      state: f.address_stateOrRegion || 'Unknown',
      specialties: (f.specialties || []).join(', '),
      procedures: (f.procedure || []).join(', '),
      equipment: (f.equipment || []).join(', '),
      capabilities: (f.capability || []).join(', '),
      description: (f.description || '').slice(0, 500),
      lat: f.latitude,
      lng: f.longitude
    }));

    // 3. Call Gemini to reason about the best matches
    const prompt = buildAgentPrompt(query, context);
    const geminiResponse = await callGemini(prompt);

    // 4. Parse Gemini's structured response
    const results = parseGeminiResponse(geminiResponse, candidates, allFacilities);

    return res.status(200).json({ results });

  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// -- Helper Functions --

function preFilterByKeywords(query, facilities) {
  const keywords = query.toLowerCase().split(/\s+/);
  return facilities
    .map(f => {
      const text = [
        f.name, f.description, 
        (f.specialties || []).join(' '), 
        (f.procedure || []).join(' '),
        (f.capability || []).join(' '),
        f.address_city, f.address_stateOrRegion
      ].join(' ').toLowerCase();
      const score = keywords.filter(kw => text.includes(kw)).length;
      return { ...f, _keywordScore: score };
    })
    .filter(f => f._keywordScore > 0)
    .sort((a, b) => b._keywordScore - a._keywordScore);
}

function buildAgentPrompt(query, candidates) {
  return `You are an agentic healthcare intelligence system for India. Your task is to find the best medical facilities matching a patient's query from a list of candidates.

PATIENT QUERY: "${query}"

CANDIDATE FACILITIES (JSON):
${JSON.stringify(candidates, null, 2)}

INSTRUCTIONS:
1. Analyze each candidate for relevance to the query (consider location, specialties, equipment, capabilities).
2. For each relevant facility, compute a trust score (0-100) based on:
   - Completeness of the report (longer description = more reliable)
   - Whether equipment listed matches claimed capabilities
   - Whether location data is present
3. Flag contradictions (e.g., claims ICU but no ventilator listed, claims surgery but no anesthesiologist mentioned).
4. Provide a citation (exact relevant snippet from the description).
5. Return ONLY a valid JSON array of the top 5 matches (or fewer if less found).

OUTPUT FORMAT (JSON array, no other text):
[
  {
    "candidate_id": 0,
    "relevance_reason": "Has pediatric ICU with ventilator, located in requested city",
    "trust_score": 85,
    "contradictions": [],
    "citation": "exact sentence from description..."
  },
  ...
]

If no facilities match, return an empty array [].`;
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
    })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
}

function parseGeminiResponse(text, candidates, allFacilities) {
  // Extract JSON from Gemini's response (handle markdown fences)
  let jsonStr = text.trim();
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
  jsonStr = jsonStr.trim();

  let agentResults;
  try {
    agentResults = JSON.parse(jsonStr);
  } catch {
    return [];
  }

  return agentResults.map(r => {
    const candidate = candidates[r.candidate_id];
    const full = allFacilities.find(f => f.name === candidate?.name) || candidate || {};
    return {
      name: full.name || candidate?.name || 'Unknown',
      description: full.description || '',
      specialties: full.specialties || [],
      procedure: full.procedure || [],
      equipment: full.equipment || [],
      capability: full.capability || [],
      address_city: full.address_city || candidate?.city || '',
      address_stateOrRegion: full.address_stateOrRegion || candidate?.state || '',
      latitude: full.latitude || candidate?.lat || null,
      longitude: full.longitude || candidate?.lng || null,
      trust_score: r.trust_score || 50,
      contradictions: r.contradictions || [],
      citation: r.citation || '',
      relevance_reason: r.relevance_reason || ''
    };
  });
}
