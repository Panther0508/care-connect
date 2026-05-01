// src/services/diseaseShSearch.js
// disease.sh - Free real-time disease outbreak data
// https://disease.sh/

const BASE_URL = 'https://disease.sh/v3/covid-19';

/**
 * Fetch COVID-19 data by country
 * @param {string} countryCode - ISO 2-letter or 3-letter country code
 */
export async function fetchCovidCountry(countryCode) {
  try {
    const resp = await fetch(`${BASE_URL}/countries/${countryCode}`);
    if (!resp.ok) throw new Error(`disease.sh: ${resp.status}`);
    const data = await resp.json();

    return {
      country: data.country || '',
      cases: data.cases || 0,
      todayCases: data.todayCases || 0,
      deaths: data.deaths || 0,
      recovered: data.recovered || 0,
      active: data.active || 0,
      population: data.population || 0,
      source: 'disease.sh / Johns Hopkins CSSE',
      url: 'https://disease.sh/'
    };
  } catch (err) {
    console.error('disease.sh COVID fetch failed:', err);
    return null;
  }
}

/**
 * Fetch global COVID statistics
 */
export async function fetchCovidGlobal() {
  try {
    const resp = await fetch(`${BASE_URL}/all`);
    if (!resp.ok) throw new Error(`disease.sh global: ${resp.status}`);
    const data = await resp.json();

    return {
      cases: data.cases || 0,
      deaths: data.deaths || 0,
      recovered: data.recovered || 0,
      active: data.active || 0,
      affectedCountries: data.affectedCountries || 0,
      source: 'disease.sh'
    };
  } catch (err) {
    console.error('disease.sh global failed:', err);
    return null;
  }
}

/**
 * Fetch other disease outbreak data
 * @param {string} disease - 'chikungunya', 'ebola', 'cholera', 'flu', 'measles', 'mpox', etc.
 */
export async function fetchOutbreakData(disease = 'cholera', countryCode = null) {
  const endpoints = {
    cholera: 'https://cholera-api.azurewebsites.net/api/Cholera',
    ebola: 'https://ebola-api.azurewebsites.net/api/Ebola',
    flu: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv'
    // Add more as needed
  };

  const endpoint = endpoints[disease.toLowerCase()];
  if (!endpoint) return { error: `No endpoint for ${disease}` };

  try {
    const resp = await fetch(endpoint);
    if (!resp.ok) throw new Error(`disease.sh ${disease}: ${resp.status}`);

    const data = await resp.json();

    return {
      disease,
      data: data.slice(0, 10), // Top 10
      source: 'disease.sh',
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error(`disease.sh ${disease} fetch failed:`, err);
    return { disease, error: err.message };
  }
}

export default {
  fetchCovidCountry,
  fetchCovidGlobal,
  fetchOutbreakData
};
