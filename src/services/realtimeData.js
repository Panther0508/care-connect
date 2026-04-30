/**
 * Real-time health data service with IndexedDB caching
 * Fetches data from multiple external health data APIs
 */

import { getCached, setCached, isFresh } from './dataCache.js';

const CACHE_TTL = {
  outbreaks: 60 * 60 * 1000,      // 1 hour
  facilities: 24 * 60 * 60 * 1000, // 24 hours
  diseaseStats: 6 * 60 * 60 * 1000, // 6 hours
  who: 6 * 60 * 60 * 1000,         // 6 hours
  cdc: 6 * 60 * 60 * 1000,         // 6 hours
};

const DEFAULT_HEADERS = {
  'User-Agent': 'VitaChain-DataDownloader/1.0',
  'Accept': 'application/json',
};

/**
 * Helper to build a bounding box from lat/lng/radius (approximate)
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {number} radiusKm - Radius in kilometers
 * @returns {{north: number, south: number, east: number, west: number}}
 */
function buildBbox(lat, lng, radiusKm) {
  // Approximate conversion: 1 degree latitude ≈ 111 km
  // 1 degree longitude ≈ 111 km * cos(latitude)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
}

/**
 * Fetch with error handling and optional cache fallback
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Response>}
 */
async function safeFetch(url, options = {}, timeout = 30000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const signal = controller ? controller.signal : null;

  const timer = controller
    ? setTimeout(() => controller.abort(), timeout)
    : null;

  try {
    const response = await fetch(url, { ...options, signal });
    if (timer) clearTimeout(timer);
    return response;
  } catch (err) {
    if (timer) clearTimeout(timer);
    throw err;
  }
}

/**
 * Fetch outbreak alerts (COVID-19 and Influenza)
 * @returns {Promise<{cached: boolean, data: object|null, error?: string, stale?: boolean}>}
 */
export async function getOutbreakAlerts() {
  const cacheKey = 'realtime:outbreaks';
  const cached = await getCached(cacheKey);

  if (cached && isFresh(cached)) {
    if (import.meta.env.DEBUG) console.log('[realtime] Returning fresh cached outbreak data');
    return { cached: true, data: cached.data };
  }

  try {
    const [covidRes, fluRes] = await Promise.allSettled([
      safeFetch('https://disease.sh/v3/covid-19/all', {
        headers: DEFAULT_HEADERS,
      }),
      safeFetch('https://disease.sh/v3/influenza/current', {
        headers: DEFAULT_HEADERS,
      }),
    ]);

    const result = {
      covid: null,
      influenza: null,
      alerts: [],
    };

    if (covidRes.status === 'fulfilled' && covidRes.value?.ok) {
      const covidData = await covidRes.value.json();
      result.covid = {
        cases: covidData.cases || 0,
        deaths: covidData.deaths || 0,
        recovered: covidData.recovered || 0,
        updated: covidData.updated || Date.now(),
      };
    }

    if (fluRes.status === 'fulfilled' && fluRes.value?.ok) {
      const fluData = await fluRes.value.json();
      // Flu API returns an array
      if (Array.isArray(fluData) && fluData.length > 0) {
        const latest = fluData[0];
        result.influenza = {
          type: latest.type || 'Influenza',
          lastUpdated: latest.date || Date.now(),
          cases: latest.cases || 0,
        };
      } else if (fluData && typeof fluData === 'object') {
        result.influenza = {
          type: fluData.type || 'Influenza',
          lastUpdated: fluData.date || fluData.lastUpdated || Date.now(),
          cases: fluData.cases || 0,
        };
      }
    }

    // Generate alerts based on thresholds
    if (result.covid && result.covid.cases > 1000000) {
      result.alerts.push({
        level: 'warning',
        type: 'covid',
        message: 'High COVID-19 case count detected globally',
      });
    }

    if (result.influenza && result.influenza.cases > 10000) {
      result.alerts.push({
        level: 'warning',
        type: 'influenza',
        message: 'Elevated influenza activity detected',
      });
    }

    await setCached(cacheKey, result, CACHE_TTL.outbreaks);
    return { cached: false, data: result };
  } catch (err) {
    if (import.meta.env.DEBUG) console.error('[realtime] Outbreak fetch error:', err);

    if (cached) {
      return { cached: true, data: cached.data, stale: true };
    }
    return { cached: false, data: null, error: err.message || 'Failed to fetch outbreak data' };
  }
}

/**
 * Fetch WHO Global Health Indicators
 * @returns {Promise<{cached: boolean, data: Array|null, error?: string, stale?: boolean}>}
 */
export async function getWHOIndicators() {
  const cacheKey = 'realtime:who';
  const cached = await getCached(cacheKey);

  if (cached && isFresh(cached)) {
    if (import.meta.env.DEBUG) console.log('[realtime] Returning fresh cached WHO data');
    return { cached: true, data: cached.data };
  }

  try {
    const response = await safeFetch(
      'https://ghoapi.azureedge.net/api/WHOSIS_00000001?$top=5',
      {
        headers: DEFAULT_HEADERS,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const jsonData = await response.json();
    const indicators = (jsonData.value || []).map((item) => ({
      value: item.NumericValue || item.Value || null,
      year: item.TimeDim || item.Year || null,
      dim1: item.Dim1 || item.Country || null,
      dim2: item.Dim2 || item.Gender || null,
    }));

    await setCached(cacheKey, indicators, CACHE_TTL.who);
    return { cached: false, data: indicators };
  } catch (err) {
    if (import.meta.env.DEBUG) console.error('[realtime] WHO fetch error:', err);

    if (cached) {
      return { cached: true, data: cached.data, stale: true };
    }
    return { cached: false, data: null, error: err.message || 'Failed to fetch WHO indicators' };
  }
}

/**
 * Fetch nearby health facilities
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusKm - Search radius in kilometers (default 50)
 * @returns {Promise<{cached: boolean, data: Array, error?: string, stale?: boolean}>}
 */
export async function getNearbyFacilities(lat, lng, radiusKm = 50) {
  const cacheKey = `realtime:facilities:${lat.toFixed(2)}:${lng.toFixed(2)}:${radiusKm}`;
  const cached = await getCached(cacheKey);

  if (cached && isFresh(cached)) {
    if (import.meta.env.DEBUG) console.log('[realtime] Returning fresh cached facilities data');
    return { cached: true, data: cached.data };
  }

  const bbox = buildBbox(lat, lng, radiusKm);
  const overpassQuery = `[out:json];node["amenity"~"clinic|doctors|hospital|pharmacy"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});out;`;
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  try {
    const response = await safeFetch(overpassUrl, {
      headers: DEFAULT_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const jsonData = await response.json();
    const facilities = (jsonData.elements || []).map((node) => ({
      id: node.id || `${node.type}_${Math.random().toString(36).substr(2, 9)}`,
      name: (node.tags && (node.tags.name || node.tags['addr:housename'])) || 'Unnamed',
      lat: node.lat || (node.center && node.center.lat) || null,
      lon: node.lon || (node.center && node.center.lon) || null,
      type: (node.tags && node.tags.amenity) || 'unknown',
      address: (node.tags && (node.tags['addr:full'] || node.tags['addr:city'] || node.tags['addr:town'])) || '',
    }));

    // Try Healthsites.io as secondary source if Overpass returned very few results
    if (facilities.length < 3) {
      try {
        const healthsitesRes = await safeFetch(
          `https://healthsites.io/api/v2/facilities?page=1&page_size=100&country=NG&api_key=hs_76f3c9b0`,
          {
            headers: DEFAULT_HEADERS,
          }
        );

        if (healthsitesRes && healthsitesRes.ok) {
          const hsData = await healthsitesRes.json();
          if (hsData && hsData.features && Array.isArray(hsData.features)) {
            hsData.features.forEach((feature) => {
              if (feature.geometry && feature.geometry.coordinates) {
                facilities.push({
                  id: feature.id || feature.properties?.id || `hs_${Math.random().toString(36).substr(2, 9)}`,
                  name: feature.properties?.name || 'Unnamed Facility',
                  lat: feature.geometry.coordinates[1],
                  lon: feature.geometry.coordinates[0],
                  type: feature.properties?.facility_type || feature.properties?.facility || 'clinic',
                  address: feature.properties?.address || feature.properties?.city || '',
                });
              }
            });
          }
        }
      } catch (secondaryErr) {
        if (import.meta.env.DEBUG) console.log('[realtime] Healthsites secondary source failed:', secondaryErr);
      }
    }

    await setCached(cacheKey, facilities, CACHE_TTL.facilities);
    return { cached: false, data: facilities };
  } catch (err) {
    if (import.meta.env.DEBUG) console.error('[realtime] Facilities fetch error:', err);

    // Try Healthsites.io as fallback
    try {
      const healthsitesRes = await safeFetch(
        `https://healthsites.io/api/v2/facilities?page=1&page_size=100&country=NG&api_key=hs_76f3c9b0`,
        {
          headers: DEFAULT_HEADERS,
        }
      );

      if (healthsitesRes && healthsitesRes.ok) {
        const hsData = await healthsitesRes.json();
        if (hsData && hsData.features && Array.isArray(hsData.features)) {
          const facilities = hsData.features.map((feature) => ({
            id: feature.id || feature.properties?.id || `hs_${Math.random().toString(36).substr(2, 9)}`,
            name: feature.properties?.name || 'Unnamed Facility',
            lat: feature.geometry?.coordinates?.[1] || null,
            lon: feature.geometry?.coordinates?.[0] || null,
            type: feature.properties?.facility_type || feature.properties?.facility || 'clinic',
            address: feature.properties?.address || feature.properties?.city || '',
          }));
          await setCached(cacheKey, facilities, CACHE_TTL.facilities);
          return { cached: false, data: facilities };
        }
      }
    } catch (fallbackErr) {
      if (import.meta.env.DEBUG) console.log('[realtime] Healthsites fallback also failed:', fallbackErr);
    }

    if (cached) {
      return { cached: true, data: cached.data, stale: true };
    }
    return { cached: false, data: [], error: err.message || 'Failed to fetch nearby facilities' };
  }
}

/**
 * Fetch CDC surveillance data (hospital capacity)
 * @returns {Promise<{cached: boolean, data: Array|null, error?: string, stale?: boolean}>}
 */
export async function getCDCSurveillance() {
  const cacheKey = 'realtime:cdc';
  const cached = await getCached(cacheKey);

  if (cached && isFresh(cached)) {
    if (import.meta.env.DEBUG) console.log('[realtime] Returning fresh cached CDC data');
    return { cached: true, data: cached.data };
  }

  try {
    const response = await safeFetch(
      'https://data.cdc.gov/resource/9mfq-cb48.json?$limit=50',
      {
        headers: DEFAULT_HEADERS,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const jsonData = await response.json();
    const surveillance = (jsonData || []).map((record) => ({
      state: record.state || 'Unknown',
      previous_day_admission_adult_covid_confirmed: parseInt(record.previous_day_admission_adult_covid_confirmed, 10) || 0,
      previous_day_admission_pediatric_covid_confirmed: parseInt(record.previous_day_admission_pediatric_covid_confirmed, 10) || 0,
      total_adult_patients_hospitalized_confirmed_covid: parseInt(record.total_adult_patients_hospitalized_confirmed_covid, 10) || 0,
      total_pediatric_patients_hospitalized_confirmed_covid: parseInt(record.total_pediatric_patients_hospitalized_confirmed_covid, 10) || 0,
      total_beds_7_day_sum: parseInt(record.total_beds_7_day_sum, 10) || 0,
      staffed_icu_adult_occupancy_pct: parseFloat(record.staffed_icu_adult_occupancy_pct) || 0,
      inpatient_beds_used_covid: parseInt(record.inpatient_beds_used_covid, 10) || 0,
      collection_week: record.collection_week || null,
    }));

    await setCached(cacheKey, surveillance, CACHE_TTL.cdc);
    return { cached: false, data: surveillance };
  } catch (err) {
    if (import.meta.env.DEBUG) console.error('[realtime] CDC fetch error:', err);

    if (cached) {
      return { cached: true, data: cached.data, stale: true };
    }
    return { cached: false, data: null, error: err.message || 'Failed to fetch CDC surveillance data' };
  }
}

/**
 * Fetch aggregated disease statistics (COVID-19 + Influenza + global data)
 * @returns {Promise<{cached: boolean, data: object|null, error?: string, stale?: boolean}>}
 */
export async function getDiseaseStats() {
  const cacheKey = 'realtime:diseaseStats';
  const cached = await getCached(cacheKey);

  if (cached && isFresh(cached)) {
    if (import.meta.env.DEBUG) console.log('[realtime] Returning fresh cached disease stats');
    return { cached: true, data: cached.data };
  }

  try {
    const [globalRes, countriesRes, fluRes] = await Promise.allSettled([
      safeFetch('https://disease.sh/v3/covid-19/all', {
        headers: DEFAULT_HEADERS,
      }),
      safeFetch('https://disease.sh/v3/covid-19/countries', {
        headers: DEFAULT_HEADERS,
      }),
      safeFetch('https://disease.sh/v3/influenza/current', {
        headers: DEFAULT_HEADERS,
      }),
    ]);

    let totalCases = 0;
    let totalDeaths = 0;
    let totalRecovered = 0;
    let countriesAffected = 0;
    let updated = Date.now();
    let influenzaCases = 0;

    if (globalRes.status === 'fulfilled' && globalRes.value?.ok) {
      const globalData = await globalRes.value.json();
      totalCases = globalData.cases || 0;
      totalDeaths = globalData.deaths || 0;
      totalRecovered = globalData.recovered || 0;
      updated = globalData.updated || updated;
    }

    if (countriesRes.status === 'fulfilled' && countriesRes.value?.ok) {
      const countriesData = await countriesRes.value.json();
      if (Array.isArray(countriesData)) {
        countriesAffected = countriesData.length;
      }
    }

    if (fluRes.status === 'fulfilled' && fluRes.value?.ok) {
      const fluData = await fluRes.value.json();
      if (Array.isArray(fluData)) {
        influenzaCases = fluData.reduce((sum, item) => sum + (item.cases || 0), 0);
      } else if (fluData && typeof fluData === 'object') {
        influenzaCases = fluData.cases || 0;
      }
    }

    const result = {
      totalCases,
      totalDeaths,
      totalRecovered,
      countriesAffected,
      influenzaCases,
      combinedCases: totalCases + influenzaCases,
      updated,
    };

    await setCached(cacheKey, result, CACHE_TTL.diseaseStats);
    return { cached: false, data: result };
  } catch (err) {
    if (import.meta.env.DEBUG) console.error('[realtime] Disease stats fetch error:', err);

    if (cached) {
      return { cached: true, data: cached.data, stale: true };
    }
    return { cached: false, data: null, error: err.message || 'Failed to fetch disease statistics' };
  }
}

/**
 * Invalidate cache for a specific function or all caches
 * @param {string} [functionName] - Optional function name (outbreaks, who, facilities, cdc, diseaseStats)
 * @returns {Promise<boolean>}
 */
export async function invalidateCache(functionName) {
  if (functionName) {
    const cacheKey = `realtime:${functionName}`;
    return removeCached(cacheKey);
  }
  return clearCache();
}
