// src/services/whoGHOSearch.js
// WHO Global Health Observatory API - Free, no key required
// https://ghoapi.azureedge.net/api/

const BASE_URL = 'https://ghoapi.azureedge.net/api';

/**
 * Fetch WHO indicator data
 * @param {string} indicatorCode - WHO indicator code (e.g., 'RD_POP_RATE', 'WHS1_100')
 * @param {string} countryCode - ISO 3-letter country code (optional)
 * @returns {Promise<Array>}
 */
export async function fetchWHOIndicator(indicatorCode, countryCode = null) {
  try {
    let url = `${BASE_URL}/${indicatorCode}?$format=json`;
    if (countryCode) {
      url += `&$filter=SpatialDim eq '${countryCode}'`;
    }

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`WHO GHO: ${resp.status}`);

    const data = await resp.json();
    const values = data.value || [];

    return values.map(v => ({
      indicator: indicatorCode,
      country: v.SpatialDim || 'Global',
      year: v.TimeDim || '',
      value: v.NumericValue || v.Value || null,
      unit: v.Unit || '',
      source: 'WHO Global Health Observatory',
      url: `https://www.who.int/data/gho/data/indicators/indicator-details/${indicatorCode}`
    }));
  } catch (err) {
    console.error('WHO GHO fetch failed:', err);
    return [];
  }
}

/**
 * Get list of available WHO indicators
 */
export async function listWHOIndicators() {
  try {
    const resp = await fetch(`${BASE_URL}/indicator?$format=json`);
    if (!resp.ok) throw new Error(`WHO GHO list: ${resp.status}`);

    const data = await resp.json();
    return data.value || [];
  } catch (err) {
    console.error('WHO indicator list failed:', err);
    return [];
  }
}

/**
 * Search indicators by keyword
 */
export async function searchWHOIndicators(keyword) {
  const all = await listWHOIndicators();
  const lower = keyword.toLowerCase();
  return all.filter(i =>
    (i.IndicatorName || '').toLowerCase().includes(lower) ||
    (i.IndicatorCode || '').toLowerCase().includes(lower)
  ).slice(0, 10);
}

/**
 * Get malaria incidence for a country
 */
export async function getMalariaIncidence(countryCode) {
  return await fetchWHOIndicator('WHS1_100', countryCode);
}

/**
 * Get life expectancy
 */
export async function getLifeExpectancy(countryCode) {
  return await fetchWHOIndicator('MDG_0000000025', countryCode);
}

/**
 * Get maternal mortality ratio
 */
export async function getMaternalMortality(countryCode) {
  return await fetchWHOIndicator('MDG_0000000029', countryCode);
}

export default {
  fetchWHOIndicator,
  listWHOIndicators,
  searchWHOIndicators,
  getMalariaIncidence,
  getLifeExpectancy,
  getMaternalMortality
};
