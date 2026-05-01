// src/services/openRouterService.js
// OpenRouter Free Tier - 200 req/day, no credit card
// https://openrouter.ai/

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

const FREE_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-27b-it:free',
  'meta-llama/llama-4-34b-instruct:free',
  'microsoft/phi-4-reasoning:free',
  'qwen/qwen-3-235b-a22b:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free'
];

/**
 * Query OpenRouter with a free model
 * @param {string} prompt - User prompt
 * @param {string} systemPrompt - System instruction
 * @param {string} preferredModel - Optional specific free model
 * @returns {Promise<{text, model, citations}>}
 */
export async function queryOpenRouter(prompt, systemPrompt = '', preferredModel = null) {
  if (!API_KEY) {
    throw new Error('VITE_OPENROUTER_API_KEY not set');
  }

  const model = preferredModel || FREE_MODELS[0];

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'VitaChain Health AI'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1024,
        temperature: 0.3,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      text: content,
      model: data.model || model,
      source: 'openrouter',
      provider: 'openrouter'
    };
  } catch (err) {
    console.error('OpenRouter query failed:', err);
    throw err;
  }
}

/**
 * Fallback cascade: try multiple free models
 */
export async function queryOpenRouterFallback(prompt, systemPrompt) {
  for (const model of FREE_MODELS) {
    try {
      const result = await queryOpenRouter(prompt, systemPrompt, model);
      return { ...result, model: model + ' (OpenRouter)' };
    } catch (err) {
      console.warn(`OpenRouter model ${model} failed, trying next...`, err.message);
      continue;
    }
  }
  throw new Error('All OpenRouter models exhausted');
}

export default {
  queryOpenRouter,
  queryOpenRouterFallback,
  FREE_MODELS
};
