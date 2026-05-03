// src/services/modelLoader.js
// Centralized Model Loader - Phase 3
// Uses jsDelivr CDN proxy for reliable HuggingFace model loading

import { pipeline, env } from '@huggingface/transformers';

// Configure environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// Custom fetch that proxies HuggingFace model files through jsDelivr CDN
// This avoids CORS issues and ensures reliable delivery
const hfFetch = async (url, init) => {
  // Transform huggingface.co model file URLs to jsDelivr
  // Example: https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/onnx/model_quantized.onnx
  // Becomes: https://cdn.jsdelivr.net/gh/Xenova/all-MiniLM-L6-v2@main/onnx/model_quantized.onnx
  const hfMatch = url.match(/https?:\/\/huggingface\.co\/([^/]+\/[^/]+)\/resolve\/main\/(.+)/);
  if (hfMatch) {
    const modelId = hfMatch[1];
    const filePath = hfMatch[2];
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${modelId}@main/${filePath}`;
    console.log('Proxying via jsDelivr:', cdnUrl);
    return fetch(cdnUrl, init);
  }
  return fetch(url, init);
};

// Override transformers' fetch globally
env.fetch = hfFetch;

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
    // Wait for in-flight load
    while (modelLoading[type]) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (models[type]) return models[type];
    // Loading failed earlier, return null instead of throwing
    return null;
  }

  modelLoading[type] = true;
  const config = MODEL_CONFIGS[type];

  try {
    console.log(`Loading model: ${type} (${config.model})`);
    const loadedModel = await pipeline(config.task, config.model, {
      ...config.options,
      progress_callback: onProgress || ((p) => {
        if (p.status === 'downloading' || p.status === 'progress') {
          const pct = Math.round((p.loaded || 0) / (p.total || 1) * 100);
          if (pct % 10 === 0) console.log(`  ${type}: ${pct}%`);
        }
      })
      // fetch is globally overridden via env.fetch
    });
    models[type] = loadedModel;
    console.log(`✅ Model loaded: ${type}`);
    return loadedModel;
  } catch (err) {
    console.error(`Failed to load model ${type} (${config.model}):`, err);
    models[type] = null; // cache null to avoid repeated attempts
    throw err;
  } finally {
    modelLoading[type] = false;
  }
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
