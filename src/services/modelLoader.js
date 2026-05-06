// src/services/modelLoader.js
// Centralized Model Loader - Phase 3
// Uses jsDelivr CDN proxy (configured in main.tsx) for reliable HuggingFace model loading

import { pipeline, env } from '@huggingface/transformers';

// Configure - fetch override is set globally in main.tsx
env.allowLocalModels = false;
env.useBrowserCache = true;
env.localModelPath = '/models/';  // Local model directory

// Model cache
const models = {
  textGeneration: null,
  embedding: null,
  featureExtraction: null,
  zeroShotImage: null,
  speechRecognition: null,
  translation: null
};

const modelLoading = {
  textGeneration: false,
  embedding: false,
  featureExtraction: false,
  zeroShotImage: false,
  speechRecognition: false,
  translation: false
};

const MODEL_CONFIGS = {
  textGeneration: {
    // Load from local /models/ directory (offline-first)
    // The TinyLlama model files are in public/models/Xenova/TinyLlama-1.1B-Chat-v1.0/
    model: '/models/Xenova/TinyLlama-1.1B-Chat-v1.0',
    task: 'text-generation',
    options: { model_type: 'llama' }
  },
  embedding: {
    // Load from local /models/ directory only — no remote fallback
    model: '/models/Xenova/all-MiniLM-L6-v2',
    task: 'feature-extraction',
    options: {}
  },
  featureExtraction: {
    model: '/models/Xenova/all-MiniLM-L6-v2',
    task: 'feature-extraction',
    options: {}
  },
  zeroShotImage: {
    model: 'Xenova/clip-vit-base-patch32',
    task: 'zero-shot-image-classification',
    options: {}
  },
  speechRecognition: {
    model: 'Xenova/whisper-tiny',
    task: 'automatic-speech-recognition',
    options: {}
  },
  translation: {
    model: 'facebook/nllb-200-distilled-600M',
    task: 'translation',
    options: {}
  }
};

/**
 * Load a model with progress tracking and robust error handling
 */
async function loadModel(type, onProgress) {
  if (models[type]) return models[type];
  if (modelLoading[type]) {
    while (modelLoading[type]) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (models[type]) return models[type];
    return null; // failed earlier
  }

  modelLoading[type] = true;

  // Per-model env configuration
  if (type === 'textGeneration') {
    // TinyLlama must load from local /models/ for offline support
    env.allowRemoteModels = false;  // Do not fetch from remote
    env.allowLocalModels = true;    // Allow local /models/ path
  } else if (type === 'embedding' || type === 'featureExtraction') {
    env.allowRemoteModels = false;  // Load from local /models/ only
    env.allowLocalModels = true;    // Permit local /models/ path
  } else {
    // Default for other models (translation, speech, image): allow remote from HuggingFace
    env.allowRemoteModels = true;
    env.allowLocalModels = false;
  }

  const config = MODEL_CONFIGS[type];
  const maxAttempts = 3;
  let lastErr = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Loading model: ${type} (${config.model}) — attempt ${attempt}/${maxAttempts}`);
      const loadedModel = await pipeline(config.task, config.model, {
        ...config.options,
        progress_callback: onProgress || ((p) => {
          if (p.status === 'downloading' || p.status === 'progress') {
            const pct = Math.round((p.loaded || 0) / (p.total || 1) * 100);
            if (pct % 10 === 0) console.log(`  ${type}: ${pct}%`);
          }
        })
        // fetch is globally overridden via env.fetch (main.tsx)
      });
      models[type] = loadedModel;
      modelLoading[type] = false;
      console.log(`✅ Model loaded: ${type}`);
      return loadedModel;
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️ Model load attempt ${attempt} failed for ${type}:`, err?.message || err);
      if (attempt < maxAttempts) {
        const delay = attempt === 1 ? 2000 : attempt === 2 ? 4000 : 3600000; // 1 hour on 3rd attempt
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  // All attempts failed
  models[type] = null;
  modelLoading[type] = false;
  console.error(`❌ Model ${type} failed to load after ${maxAttempts} attempts`);
  throw lastErr;
}

// Text Generation (TinyLlama)
export async function getTextGenerator(onProgress) {
  return await loadModel('textGeneration', onProgress);
}

// Embedding / Feature Extraction (shared)
export async function getEmbeddingModel(onProgress) {
  return await loadModel('featureExtraction', onProgress);
}

// Zero-shot Image Classification (CLIP)
export async function getImageClassifier(onProgress) {
  return await loadModel('zeroShotImage', onProgress);
}

// Speech Recognition (Whisper)
export async function getSpeechRecognizer(onProgress) {
  return await loadModel('speechRecognition', onProgress);
}

// Translation (NLLB)
export async function getTranslator(onProgress) {
  return await loadModel('translation', onProgress);
}

// Get tokenizer for a model
export async function getTokenizer(type) {
  const model = await loadModel(type);
  if (!model) throw new Error(`Model ${type} not available`);
  return model.tokenizer;
}

// Check model status
export function getModelStatus(type) {
  if (models[type]) return { loaded: true, loading: false, error: null };
  if (modelLoading[type]) return { loaded: false, loading: true, error: null };
  return { loaded: false, loading: false, error: 'Not loaded' };
}

// Get all model statuses
export function getAllModelStatuses() {
  const statuses = {};
  Object.keys(models).forEach(type => {
    statuses[type] = getModelStatus(type);
  });
  return statuses;
}

// Initialize models (optional)
export async function initializeModels(options = {}) {
  const { include = ['featureExtraction', 'textGeneration'] } = options;
  
  const promises = include.map(type => 
    loadModel(type).catch(err => {
      console.warn(`Model ${type} failed to initialize:`, err);
      return null;
    })
  );
  
  await Promise.allSettled(promises);
  console.log('✅ Model initialization complete');
}

export default {
  getTextGenerator,
  getEmbeddingModel,
  getImageClassifier,
  getSpeechRecognizer,
  getTranslator,
  getTokenizer,
  getModelStatus,
  getAllModelStatuses,
  initializeModels
};
