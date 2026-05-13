// src/services/imageClassifier.js
// Zero-shot image classification using CLIP model for skin lesion analysis

import { pipeline, env } from '@huggingface/transformers';

// Use global env configuration from modelLoader; enable browser cache
env.useBrowserCache = true;

let classifier = null;
let classifierLoading = false;
let classifierLoaded = false;
let classifierError = null;

// Candidate labels for zero-shot classification
const SKIN_CONDITIONS = [
  'healthy skin',
  'rash or eczema',
  'fungal infection',
  'bacterial infection',
  'psoriasis',
  'acne or pimples',
  'sunburn',
  'allergic reaction',
  'dry skin',
  'skin irritation'
];

/**
 * Load CLIP model for zero-shot classification
 */
async function loadClassifier() {
  if (classifierLoaded) return classifier;
  if (classifierLoading) {
    while (classifierLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (classifierError) throw classifierError;
    return classifier;
  }

  classifierLoading = true;
  try {
    classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
    classifierLoaded = true;
    console.log('✅ CLIP model loaded for image classification');
  } catch (err) {
    console.error('Failed to load CLIP model:', err);
    classifierError = err;
    throw err;
  } finally {
    classifierLoading = false;
  }
  return classifier;
}

/**
 * Preprocess image for classification
 */
function preprocessImage(imageElement) {
  // Create canvas for resizing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Resize to 224x224 (CLIP input size)
  canvas.width = 224;
  canvas.height = 224;
  
  // Draw image maintaining aspect ratio
  const scale = Math.max(224 / imageElement.width, 224 / imageElement.height);
  const w = imageElement.width * scale;
  const h = imageElement.height * scale;
  const x = (224 - w) / 2;
  const y = (224 - h) / 2;
  
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 224, 224);
  ctx.drawImage(imageElement, x, y, w, h);
  
  return canvas;
}

/**
 * Classify skin lesion from image
 */
export async function analyzeSkinLesion(imageElement, options = {}) {
  if (!imageElement) {
    throw new Error('No image provided');
  }

  try {
    await loadClassifier();
    
    const candidates = options.candidates || SKIN_CONDITIONS;
    
    const result = await classifier(imageElement, candidates, {
      top_k: options.top_k || 5
    });
    
    // Format results
    const formattedResults = result.map((item, index) => ({
      rank: index + 1,
      label: item.label,
      score: Math.round(item.score * 1000) / 10, // Convert to percentage
      confidence: item.score
    }));
    
    return {
      success: true,
      results: formattedResults,
      topResult: formattedResults[0],
      timestamp: new Date().toISOString(),
      model: 'CLIP-vit-base-patch32',
      requiresFollowUp: formattedResults[0].score > 0.5 && 
                        !formattedResults[0].label.includes('healthy') &&
                        !formattedResults[0].label.includes('dry')
    };
  } catch (err) {
    console.error('Image classification failed:', err);
    throw new Error('Image analysis failed: ' + err.message);
  }
}

/**
 * Classify from file blob
 */
export async function classifyFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid image file'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        analyzeSkinLesion(img)
          .then(resolve)
          .catch(reject);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Classify from base64 string
 */
export async function classifyFromBase64(base64, mimeType = 'image/jpeg') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      analyzeSkinLesion(img)
        .then(resolve)
        .catch(reject);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

/**
 * General zero-shot classification (any image, any labels)
 */
export async function classifyImage(imageElement, candidateLabels, options = {}) {
  if (!imageElement || !candidateLabels || candidateLabels.length === 0) {
    throw new Error('Image and candidate labels required');
  }
  
  try {
    await loadClassifier();
    
    const result = await classifier(imageElement, candidateLabels, {
      top_k: options.top_k || Math.min(5, candidateLabels.length)
    });
    
    return {
      success: true,
      results: result.map((item, index) => ({
        rank: index + 1,
        label: item.label,
        score: Math.round(item.score * 1000) / 10,
        confidence: item.score
      }))
    };
  } catch (err) {
    console.error('Classification failed:', err);
    throw new Error('Classification failed: ' + err.message);
  }
}

/**
 * Get classifier status
 */
export function getClassifierStatus() {
  if (classifierLoaded) return { loaded: true, loading: false, error: null };
  if (classifierError) return { loaded: false, loading: false, error: classifierError.message };
  return { loaded: false, loading: classifierLoading, error: null };
}

/**
 * Unload classifier
 */
export function unloadClassifier() {
  classifier = null;
  classifierLoaded = false;
  classifierError = null;
  classifierLoading = false;
}

/**
 * Generate medical disclaimer
 */
export function getMedicalDisclaimer() {
  return `⚠️ IMPORTANT: This is an AI-powered preliminary screening tool only. 

This analysis is NOT a medical diagnosis and should NEVER replace consultation with a healthcare professional. Always seek immediate medical attention for:
- Rapidly spreading rashes or lesions
- Signs of infection (fever, increasing pain, redness, swelling, pus)
- Severe allergic reactions (difficulty breathing, swelling)
- Large or deep wounds
- Any concerning or worsening symptoms

When in doubt, consult a dermatologist or healthcare provider for proper evaluation and treatment.`;
}

/**
 * Format result for display
 */
export function formatClassificationResult(result) {
  if (!result || !result.results) return '';
  
  let output = `AI Analysis Results:\n\n`;
  
  result.results.forEach((item, index) => {
    const bar = '█'.repeat(Math.round(item.score / 5));
    output += `${index + 1}. ${item.label}: ${item.score}% ${bar}\n`;
  });
  
  if (result.requiresFollowUp) {
    output += `\n${getMedicalDisclaimer()}`;
  }
  
  return output;
}