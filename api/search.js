import { kv } from '@vercel/kv';

const GEMINI_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(200).json({ results: [] });
    }

    const allFacilities = await kv.get('facilities');
    if (!allFacilities || !Array.isArray(allFacilities)) {
      console.error('KV Error: Facilities data not found');
      return res.status(200).json({ results: [] });
    }

    const candidates = preFilterByKeywords(query, allFacilities).slice(0, 30);
    if (candidates.length === 0) {
      return res.status(200).json({ results: [] });
    }

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

    const prompt = buildAgentPrompt(query, context);
    const geminiResponse = await callGemini(prompt);
    const results = parseGeminiResponse(geminiResponse, candidates, allFacilities);

    return res.status(200).json({ results });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(200).json({ results: [] });
  }

    const allFacilities = await kv.get('facilities');
    if (!allFacilities || !Array.isArray(allFacilities)) {
      console.error('KV Error: Facilities data not found');
      return res.status(200).json({ results: [] }); // graceful fallback
    }

    const candidates = preFilterByKeywords(query, allFacilities).slice(0, 30);
    if (candidates.length === 0) {
      return res.status(200).json({ results: [] });
    }

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

    const prompt = buildAgentPrompt(query, context);
    const geminiResponse = await callGemini(prompt);
    const results = parseGeminiResponse(geminiResponse, candidates, allFacilities);

    return res.status(200).json({ results });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: err.message });
  }
}

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
2. For each relevant facility, compute a trust score (0-100).
3. Flag contradictions.
4. Provide a citation.
5. Return ONLY a valid JSON array of the top 5 matches.

OUTPUT FORMAT (JSON array, no other text):
[
  {
    "candidate_id": 0,
    "relevance_reason": "Brief reason",
    "trust_score": 85,
    "contradictions": [],
    "citation": "exact snippet"
  }
]

If no facilities match, return an empty array [].`;
}

async function callGemini(prompt) {
  const model = 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
    })
  });
  if (!response.ok) throw new Error(`Gemini API error ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
}

function parseGeminiResponse(text, candidates, allFacilities) {
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

  if (!Array.isArray(agentResults)) return [];

  return agentResults.map(r => {
    const idx = r.candidate_id;
    const candidate = (typeof idx === 'number' && idx >= 0 && idx < candidates.length) ? candidates[idx] : null;
    const full = candidate ? (allFacilities.find(f => f.name === candidate?.name) || candidate) : (candidate || {});
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
      trust_score: r.trust_score != null ? r.trust_score : 50,
      contradictions: Array.isArray(r.contradictions) ? r.contradictions : [],
      citation: r.citation || '',
      relevance_reason: r.relevance_reason || ''
    };
  });
}
