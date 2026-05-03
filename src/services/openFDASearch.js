// src/services/openFDASearch.js
// OpenFDA API - Drug adverse events, recalls, labeling
// Free: 1,000 req/day (120K/day with free key)
// https://open.fda.gov/apis/drug/

const API_KEY = import.meta.env.VITE_OPENFDA_API_KEY;
const BASE_URL = 'https://api.fda.gov/drug';

/**
 * Search adverse events for a drug
 * @param {string} drugName - Brand or generic name
 * @param {number} limit - Results limit (default 5)
 * @returns {Promise<Array>}
 */
export async function searchOpenFDA(drugName, limit = 5) {
  if (!drugName) return [];

  try {
    const params = new URLSearchParams({
      search: `patient.drug.medicinalproduct:"${drugName}"`,
      count: 'patient.reaction.reactionmeddrapt.exact',
      limit: limit.toString()
    });

    const auth = API_KEY ? `api_key=${API_KEY}&` : '';
    const url = `${BASE_URL}/event.json?${auth}${params}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`OpenFDA: ${resp.status}`);

    const data = await resp.json();
    const results = data.results || [];

    return results.map(r => ({
      reaction: r.term || '',
      count: r.count || 0,
      source: 'FDA Adverse Events'
    }));
  } catch (err) {
    console.error('OpenFDA search failed:', err);
    return [];
  }
}

/**
 * Search drug recalls
 * @param {string} drugName - Optional drug name
 * @param {number} limit - Results limit
 */
export async function searchDrugRecalls(drugName = null, limit = 5) {
  // BUG 7 FIX: Validate drug name before building query
  if (drugName && (drugName.length < 3 || !/^[a-z\-]+$/i.test(drugName))) {
    console.warn('⚠️ Invalid drug name for OpenFDA search:', drugName);
    return [];
  }

  try {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('sort', 'report_date:desc');
    if (drugName) {
      params.set('search', `product_description:"${drugName}"`);
    }

    const auth = API_KEY ? `api_key=${API_KEY}` : null;
    const url = `${BASE_URL}/recall.json?${params}${auth ? '&' + auth : ''}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`OpenFDA Recall: ${resp.status}`);

    const data = await resp.json();
    const results = data.results || [];

    return results.map(r => ({
      id: r.recall_number || '',
      product: r.product_description || '',
      reason: r.reason_for_recall || '',
      date: r.report_date || '',
      status: r.status || '',
      source: 'FDA Recalls',
      url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts'
    }));
  } catch (err) {
    console.error('OpenFDA recall search failed:', err);
    return [];
  }
}

/**
 * Search drug labeling information
 */
export async function searchDrugLabeling(drugName) {
  try {
    const params = new URLSearchParams({
      search: `openfda.brand_name:"${drugName}" OR openfda.generic_name:"${drugName}"`,
      limit: '1'
    });

    const auth = API_KEY ? `api_key=${API_KEY}&` : '';
    const url = `${BASE_URL}/label.json?${auth}${params}`;

    const resp = await fetch(url);
    if (!resp.ok) return null;

    const data = await resp.json();
    const result = data.results?.[0];

    if (!result) return null;

    return {
      brandName: result.openfda?.brand_name?.[0] || '',
      genericName: result.openfda?.generic_name?.[0] || '',
      manufacturer: result.openfda?.manufacturer_name?.[0] || '',
      indications: extractField(result, 'indications_and_usage'),
      warnings: extractField(result, 'warnings_and_precautions'),
      adverseReactions: extractField(result, 'adverse_reactions'),
      dosage: extractField(result, 'dosage_and_administration'),
      source: 'FDA Drug Label'
    };
  } catch (err) {
    console.error('OpenFDA labeling search failed:', err);
    return null;
  }
}

function extractField(labelData, fieldName) {
  const fields = labelData[fieldName];
  if (!fields) return '';
  if (Array.isArray(fields)) return fields[0]?.substring(0, 500) || '';
  return fields?.substring(0, 500) || '';
}

export default {
  searchOpenFDA,
  searchDrugRecalls,
  searchDrugLabeling
};
