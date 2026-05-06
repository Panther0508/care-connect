// src/services/aiOnlineHuggingFace.js
// HuggingFace queries routed through Vercel proxy to avoid CORS

/**
 * Query HuggingFace inference API via proxy
 */
export async function queryHuggingFace(model, request) {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetUrl: `https://api-inference.huggingface.co/models/${model}`,
      method: 'POST',
      body: request
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HuggingFace error: ${response.status}`);
  }

  return response.json();
}

export function buildHFModel(queryType) {
  const models = {
    general: "google/gemma-2-2b-it",
    medical: "google/medgemma-4b",
    coding: "microsoft/Phi-3-mini-4k-instruct"
  };
  return models.general;
}

export function buildHFRequest(queryType, inputData, systemPrompt) {
  return {
    inputs: [
      { role: "system", content: systemPrompt.content },
      { role: "user", content: typeof inputData === "string" ? inputData : JSON.stringify(inputData) }
    ],
    parameters: {
      temperature: 0.3,
      max_new_tokens: 1000
    }
  };
}
