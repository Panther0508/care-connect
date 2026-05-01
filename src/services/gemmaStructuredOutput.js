// src/services/gemmaStructuredOutput.js
// Structured Output Generation for Gemma 4 via Function Calling - Phase 3
// Provides JSON schemas for structured LLM responses

const SCHEMAS = {
  medicationInteraction: {
    type: 'object',
    properties: {
      severity: {
        type: 'string',
        enum: ['none', 'minor', 'moderate', 'major', 'contraindicated'],
        description: 'Severity of interaction'
      },
      description: {
        type: 'string',
        description: 'Description of the interaction'
      },
      recommendation: {
        type: 'string',
        description: 'Recommended action or alternative'
      },
      drugs: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of drugs involved'
      },
      evidenceLevel: {
        type: 'string',
        enum: ['low', 'moderate', 'high'],
        description: 'Evidence quality'
      }
    },
    required: ['severity', 'description', 'drugs'],
    additionalProperties: false
  },

  icd10CodeSchema: {
    type: 'object',
    properties: {
      codes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code: { type: 'string', pattern: '^[A-Z][0-9]{2}(\\.[A-Za-z0-9]{1,4})?$' },
            description: { type: 'string' },
            specificity: {
              type: 'string',
              enum: ['unspecified', 'partially_specified', 'fully_specified'],
              description: 'Level of diagnostic specificity'
            },
            primary: { type: 'boolean', description: 'Is primary diagnosis' }
          },
          required: ['code', 'description', 'primary']
        },
        minItems: 1,
        description: 'List of ICD-10 codes'
      },
      certainty: {
        type: 'string',
        enum: ['confirmed', 'probable', 'possible', 'rule_out'],
        description: 'Diagnostic certainty'
      }
    },
    required: ['codes', 'certainty'],
    additionalProperties: false
  },

  differentialSchema: {
    type: 'object',
    properties: {
      chiefComplaint: {
        type: 'string',
        description: 'Primary presenting symptom'
      },
      diagnoses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Diagnosis name' },
            likelihood: {
              type: 'string',
              enum: ['high', 'moderate', 'low', 'unlikely'],
              description: 'Probability assessment'
            },
            evidence: {
              type: 'array',
              items: { type: 'string' },
              description: 'Supporting clinical findings'
            },
            cannotMiss: {
              type: 'boolean',
              description: 'Life-threatening or critical diagnosis'
            }
          },
          required: ['name', 'likelihood', 'evidence', 'cannotMiss']
        },
        minItems: 2,
        maxItems: 10,
        description: 'Ranked differential diagnoses'
      },
      recommendedWorkup: {
        type: 'array',
        items: { type: 'string' },
        description: 'Suggested diagnostic tests'
      }
    },
    required: ['chiefComplaint', 'diagnoses'],
    additionalProperties: false
  },

  nutritionSchema: {
    type: 'object',
    properties: {
      foodOrDish: { type: 'string', description: 'Food item name' },
      amount: { type: 'string', description: 'Serving size (e.g., 100g, 1 cup)' },
      per100g: {
        type: 'object',
        properties: {
          calories: { type: 'number', description: 'kcal per 100g' },
          protein: { type: 'number', description: 'g per 100g' },
          carbs: { type: 'number', description: 'g per 100g' },
          fat: { type: 'number', description: 'g per 100g' },
          fiber: { type: 'number', description: 'g per 100g' },
          sodium: { type: 'number', description: 'mg per 100g' }
        },
        additionalProperties: false
      },
      recommendation: {
        type: 'string',
        description: 'Nutritional recommendation or suitability'
      }
    },
    required: ['foodOrDish', 'per100g', 'recommendation'],
    additionalProperties: false
  },

  immunizationSchema: {
    type: 'object',
    properties: {
      antigen: { type: 'string', description: 'Vaccine or antigen name' },
      recommendedDoses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            doseNumber: { type: 'integer', minimum: 1 },
            ageRangeMonths: {
              type: 'string',
              pattern: '^[0-9]+-[0-9]+$|^[0-9]+\\+$',
              description: 'Age range (e.g., "0-6", "12+'")'
            },
            formulation: { type: 'string' },
            route: { type: 'string', enum: ['IM', 'SC', 'PO', 'ID'] }
          },
          required: ['doseNumber', 'ageRangeMonths']
        },
        description: 'Dose schedule'
      },
      ageRange: {
        type: 'string',
        description: 'Target age group'
      },
      nextDue: {
        type: 'string',
        description: 'Next recommended dose timing'
      },
      contraindications: {
        type: 'array',
        items: { type: 'string' },
        description: 'Contraindications'
      }
    },
    required: ['antigen', 'recommendedDoses', 'ageRange'],
    additionalProperties: false
  }
};

/**
 * Generate function calling schema for Gemma 4
 */
export function getFunctionSchema(type) {
  const schema = SCHEMAS[type];
  if (!schema) {
    throw new Error(`Unknown schema type: ${type}`);
  }
  
  return {
    type: 'function',
    function: {
      name: type,
      description: getSchemaDescription(type),
      parameters: schema
    }
  };
}

function getSchemaDescription(type) {
  const descriptions = {
    medicationInteraction: 'Analyze and describe medication-drug interactions',
    icd10CodeSchema: 'Generate ICD-10-CM diagnostic codes from clinical description',
    differentialSchema: 'Generate ranked differential diagnoses for a chief complaint',
    nutritionSchema: 'Analyze nutritional content and provide dietary recommendations',
    immunizationSchema: 'Generate immunization schedules and recommendations',
    drugCounseling: 'Provide detailed medication counseling information'
  };
  return descriptions[type] || 'Structured output generation';
}

/**
 * Build Gemma 4 function-calling formatted prompt
 */
export function buildFunctionPrompt(messages, functionSchema) {
  return {
    systemInstruction: { 
      parts: [{ 
        text: 'You are a medical AI assistant. Use function calling to provide structured, accurate responses.' 
      }] 
    },
    contents: messages.map(m => ({ parts: [{ text: m.content }], role: m.role })),
    tools: [{ functionDeclarations: [functionSchema] }],
    toolConfig: { functionCallingConfig: { mode: 'any' } },
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
  };
}

/**
 * Parse Gemma 4 function call response
 */
export function parseFunctionResponse(response) {
  try {
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        const part = candidate.content.parts[0];
        if (part.functionCall) {
          return {
            functionName: part.functionCall.name,
            args: part.functionCall.args,
            type: 'function_call'
          };
        }
        if (part.text) {
          // Try to parse as JSON
          const parsed = JSON.parse(part.text);
          return {
            data: parsed,
            type: 'json_response'
          };
        }
      }
    }
  } catch (err) {
    console.warn('Failed to parse function response:', err);
  }
  return { response, type: 'text' };
}

/**
 * Generate structured medical analysis
 */
export async function generateStructuredAnalysis(type, context, patientData = {}) {
  const schema = getFunctionSchema(type);
  
  const messages = [
    { 
      role: 'system', 
      content: `You are a medical AI. Provide structured output for: ${getSchemaDescription(type)}. Use JSON format.`
    },
    { 
      role: 'user', 
      content: `${context}\n\nPatient context: ${JSON.stringify(patientData)}\n\nProvide structured analysis as JSON.` 
    }
  ];
  
  return {
    schema,
    messages,
    prompt: buildFunctionPrompt(messages, schema)
  };
}

export default {
  getFunctionSchema,
  buildFunctionPrompt,
  parseFunctionResponse,
  generateStructuredAnalysis,
  schemas: SCHEMAS
};