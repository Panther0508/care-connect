// src/services/huggingfaceService.js
// HuggingFace Serverless Inference - 5,000 calls/month free
// Direct calls to HuggingFace Inference API (CORS-enabled)
// https://huggingface.co/inference-api

const API_KEY = import.meta.env.VITE_HF_API_KEY;
const BASE_URL = 'https://api-inference.huggingface.co/models';

const MEDICAL_MODELS = [
  'ruslanmv/Medical-Llama3-V2',    // 8B, PubMed-trained, Apache 2.0
  'epfl-llm/meditron-7b',           // 7B, permissive, PubMed fine-tuned
  'microsoft/BiomedBERT-small',     // 22M, medical embeddings/summarization
  'mistralai/Mistral-7B-v0.1'       // General fallback
];

/**
 * Query HuggingFace inference API directly (no proxy)
 * @param {string} prompt - User prompt
 * @param {string} systemPrompt - System instruction (optional)
 * @param {string} modelId - Specific model
 * @returns {Promise<{text, model}>}
 */
export async function queryHuggingFace(prompt, systemPrompt = '', modelId = null) {
  if (!API_KEY) {
    console.warn('[HuggingFace] VITE_HF_API_KEY not set — skipping HuggingFace tier');
    throw new Error('VITE_HF_API_KEY not set');
  }

  const model = modelId || MEDICAL_MODELS[0];

  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`
    : prompt;

  try {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(model)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.3,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      if (response.status === 503) {
        // Model loading - wait and retry
        throw new Error('Model loading (503)');
      }
      throw new Error(`HuggingFace: ${response.status}`);
    }

    const data = await response.json();
    let text = '';

    if (Array.isArray(data) && data[0]?.generated_text) {
      text = data[0].generated_text.replace(fullPrompt, '').trim();
    } else if (data.generated_text) {
      text = data.generated_text.replace(fullPrompt, '').trim();
    } else {
      text = JSON.stringify(data);
    }

    return {
      text,
      model: `HF/${model.split('/')[1] || model}`,
      source: 'huggingface'
    };
  } catch (err) {
    console.error('HuggingFace query failed:', err);
    throw err;
  }
}

/**
 * Try cascade of medical models
 */
export async function queryHuggingFaceCascade(prompt, systemPrompt) {
  for (const model of MEDICAL_MODELS) {
    try {
      const result = await queryHuggingFace(prompt, systemPrompt, model);
      return { ...result, model: `${model} (HF)` };
    } catch (err) {
      if (err.message.includes('loading') || err.message.includes('503')) {
        // Model is loading - wait 2s and retry once
        await new Promise(r => setTimeout(r, 2000));
        try {
          const retry = await queryHuggingFace(prompt, systemPrompt, model);
          return { ...retry, model: `${model} (HF)` };
        } catch { /* continue to next */ }
      }
      console.warn(`HF model ${model} failed, trying next...`, err.message);
      continue;
    }
  }
  throw new Error('All HuggingFace models failed');
}

export default {
  queryHuggingFace,
  queryHuggingFaceCascade,
  MEDICAL_MODELS
};
