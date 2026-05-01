// src/services/structuredOutput.js
// Structured output generation for consistent AI responses
// Uses JSON schema with LLM sampling

import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = true;
env.useBrowserCache = true;

let generator = null;
let modelLoaded = false;
let modelLoading = false;
let loadError = null;

const MODEL_NAME = 'Xenova/TinyLlama-1.1B-Chat-v1.0';
let tokenizer = null;

/**
 * Load the generator model for structured output
 */
export async function loadStructuredModel(onProgress) {
  if (modelLoaded) return true;
  if (modelLoading) {
    while (modelLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (loadError) throw loadError;
    return true;
  }

  modelLoading = true;
  try {
    generator = await pipeline('text-generation', MODEL_NAME, {
      progress_callback: onProgress,
      model_type: 'llama',
    });
    tokenizer = generator.tokenizer;
    modelLoaded = true;
    console.log('✅ Structured output model ready');
  } catch (err) {
    console.error('Failed to load structured model:', err);
    loadError = err;
    throw err;
  } finally {
    modelLoading = false;
  }
}

/**
 * Generate structured JSON output from a prompt and schema
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt/question
 * @param {object} schema - JSON schema definition
 * @param {object} options - Generation options
 */
export async function generateStructured(systemPrompt, userPrompt, schema, options = {}) {
  if (!modelLoaded) {
    await loadStructuredModel();
  }

  const maxRetries = options.maxRetries || 3;
  const temperature = options.temperature || 0.1;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Build schema instruction
      const schemaInstruction = `
Respond with valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}

Rules:
- Output ONLY the JSON object, nothing else
- All required fields must be present
- Use null for unknown values, not empty strings (unless specified)
- Arrays should be empty [] if no items
- Numbers should be actual numbers, not strings`;

      const messages = [
        { role: 'system', content: systemPrompt + '\n\n' + schemaInstruction },
        { role: 'user', content: userPrompt }
      ];

      const formattedPrompt = tokenizer && tokenizer.apply_chat_template
        ? tokenizer.apply_chat_template(messages, { tokenize: false, add_generation_prompt: true })
        : `<|system|>\n${systemPrompt}\n\n${schemaInstruction}<|user|>\n${userPrompt}<|assistant|>\n`;

      const result = await generator(formattedPrompt, {
        max_new_tokens: options.maxTokens || 500,
        temperature: temperature,
        do_sample: temperature > 0,
        top_p: 0.9,
        stop: ['<|user|>', '<|system|>', '<|assistant|>'],
      });

      let text = result[0]?.generated_text || '';
      text = text.replace(formattedPrompt, '').trim();
      
      // Try to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      // Parse and validate
      const parsed = JSON.parse(text);
      
      // Basic schema validation
      const valid = validateSchema(parsed, schema);
      if (valid) {
        return { success: true, data: parsed };
      }
    } catch (err) {
      if (attempt === maxRetries - 1) {
        return { success: false, error: err.message, attempt: attempt + 1 };
      }
      // Wait before retry
      await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

/**
 * Validate parsed data against schema
 */
function validateSchema(data, schema) {
  if (schema.type === 'object') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return false;
    }
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          return false;
        }
      }
    }
    // Validate properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          if (!validateSchema(data[key], propSchema)) {
            return false;
          }
        }
      }
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(data)) {
      return false;
    }
    if (schema.items) {
      for (const item of data) {
        if (!validateSchema(item, schema.items)) {
          return false;
        }
      }
    }
  } else if (schema.type === 'string') {
    if (typeof data !== 'string') {
      return false;
    }
  } else if (schema.type === 'number' || schema.type === 'integer') {
    if (typeof data !== 'number' || isNaN(data)) {
      return false;
    }
  } else if (schema.type === 'boolean') {
    if (typeof data !== 'boolean') {
      return false;
    }
  } else if (schema.type === 'null') {
    if (data !== null) {
      return false;
    }
  }
  return true;
}

/**
 * Check if model is ready
 */
export function isStructuredModelReady() {
  return modelLoaded;
}

/**
 * Get model status
 */
export function structuredModelStatus() {
  if (modelLoaded) return { loaded: true, loading: false, error: null };
  if (loadError) return { loaded: false, loading: false, error: loadError.message };
  return { loaded: false, loading: modelLoading, error: null };
}

/**
 * Predefined schemas for common use cases
 */
export const SCHEMAS = {
  symptomAnalysis: {
    type: 'object',
    required: ['symptoms', 'severity', 'recommendations'],
    properties: {
      symptoms: {
        type: 'array',
        items: { type: 'string' }
      },
      severity: {
        type: 'string',
        enum: ['mild', 'moderate', 'severe', 'critical']
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' }
      },
      immediateCare: {
        type: 'boolean'
      },
      followUpNeeded: {
        type: 'boolean'
      }
    }
  },
  medicationInteraction: {
    type: 'object',
    required: ['riskLevel', 'interactions', 'recommendations'],
    properties: {
      riskLevel: {
        type: 'string',
        enum: ['none', 'minor', 'moderate', 'major', 'contraindicated']
      },
      interactions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            drugs: { type: 'array', items: { type: 'string' } },
            severity: { type: 'string' },
            description: { type: 'string' },
            mechanism: { type: 'string' }
          }
        }
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' }
      },
      monitoringRequired: {
        type: 'boolean'
      }
    }
  },
  carePlan: {
    type: 'object',
    required: ['goals', 'interventions', 'monitoring'],
    properties: {
      goals: {
        type: 'array',
        items: { type: 'string' }
      },
      interventions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            frequency: { type: 'string' },
            duration: { type: 'string' }
          }
        }
      },
      monitoring: {
        type: 'array',
        items: { type: 'string' }
      },
      timeline: {
        type: 'string'
      }
    }
  },
  diagnosis: {
    type: 'object',
    required: ['primaryDiagnosis', 'differential', 'confidence', 'nextSteps'],
    properties: {
      primaryDiagnosis: { type: 'string' },
      differential: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            condition: { type: 'string' },
            likelihood: { type: 'string' }
          }
        }
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1
      },
      supportingEvidence: {
        type: 'array',
        items: { type: 'string' }
      },
      nextSteps: {
        type: 'array',
        items: { type: 'string' }
      }
    }
  }
};
