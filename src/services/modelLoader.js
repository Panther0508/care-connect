// src/services/modelLoader.js
// Centralized Model Loader — uses HuggingFace CDN with proper CORS headers
import { pipeline, env } from '@huggingface/transformers';

// Global test-mode configuration — evaluated once at module load
const IS_TEST_MODE = import.meta.env.VITE_E2E_MODE === 'true';

if (IS_TEST_MODE) {
  // Tests: use local /models/ only, no network fetches
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  // Note: localModelPath used only in test mode
  env.localModelPath = '/models/';
} else {
  // Development/Production: use HuggingFace CDN directly (has CORS headers)
  // Models download from huggingface.co; when offline, browser serves from CacheStorage/IndexedDB
  env.allowRemoteModels = true;
  env.allowLocalModels = true; // Required for offline access to cached models
}

// Model state singleton - exported for all modules to use
let globalModelLoaded = false;
let globalEmbedderLoaded = false;

// Model cache singleton
const models = {
  textGeneration: null,
  embedding: null,
  featureExtraction: null,
  zeroShotImage: null,
  speechRecognition: null,
  translation: null,
  qwen: null
};

const modelLoading = {
  textGeneration: false,
  embedding: false,
  featureExtraction: false,
  zeroShotImage: false,
  speechRecognition: false,
  translation: false,
  qwen: false
};

const MODEL_CONFIGS = {
  textGeneration: {
    model: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
    task: 'text-generation',
    options: { model_type: 'llama' }
  },
  embedding: {
    model: 'Xenova/all-MiniLM-L6-v2',
    task: 'feature-extraction',
    options: {}
  },
  featureExtraction: {
    model: 'Xenova/all-MiniLM-L6-v2',
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
    model: 'Xenova/nllb-200-distilled-600M',
    task: 'translation',
    options: {}
  },
  qwen: {
    model: 'Xenova/Qwen1.5-0.5B-Chat',
    task: 'text-generation',
    options: { model_type: 'qwen' }
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
    return null;
  }

  modelLoading[type] = true;

  // Respect global test-mode
  if (IS_TEST_MODE) {
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.localModelPath = '/models/';
  } else {
    // Use HuggingFace CDN with CORS; allow local cache for offline reuse
    env.allowRemoteModels = true;
    env.allowLocalModels = true; // Enable IndexedDB/CacheStorage fallback
    env.localModelPath = '/models/';
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
      });
      models[type] = loadedModel;
      modelLoading[type] = false;
      console.log(`✅ Model loaded: ${type}`);
      
      // Update global state flags
      if (type === 'textGeneration' || type === 'qwen') {
        globalModelLoaded = true;
      }
      if (type === 'featureExtraction') {
        globalEmbedderLoaded = true;
      }
      
      return loadedModel;
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️ Model load attempt ${attempt} failed for ${type}:`, err?.message || err);
      if (attempt < maxAttempts) {
        const delay = attempt === 1 ? 2000 : attempt === 2 ? 4000 : 6000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  models[type] = null;
  modelLoading[type] = false;
  console.error(`❌ Model ${type} failed to load after ${maxAttempts} attempts`);
  
  // Update global state - model not loaded
  if (type === 'textGeneration' || type === 'qwen') {
    globalModelLoaded = false;
  }
  if (type === 'featureExtraction') {
    globalEmbedderLoaded = false;
  }
  
  throw lastErr;
}

// Text Generation (TinyLlama)
export async function getTextGenerator(onProgress) {
  return await loadModel('textGeneration', onProgress);
}

// Text Generation for role (CHW uses Qwen, others use TinyLlama)
export async function getTextGeneratorForRole(role, onProgress) {
  if (role === 'chw') {
    return await loadModel('qwen', onProgress);
  }
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

// Export global model state for other services
export function isModelLoaded() {
  return globalModelLoaded;
}

export function setModelLoaded(status) {
  globalModelLoaded = status;
}

export function isEmbedderLoaded() {
  return globalEmbedderLoaded;
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
  isModelLoaded,
  setModelLoaded,
  isEmbedderLoaded,
  initializeModels
};
