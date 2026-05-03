// src/services/clinicalTrialsSearch.js
// ClinicalTrials.gov v2 API - Free, no authentication
// https://clinicaltrials.gov/api/gui

const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

/**
 * Search ClinicalTrials.gov
 * @param {string} query - Search query (condition, intervention, etc.)
 * @param {Object} filters - Optional filters { phase, status, location, etc. }
 * @param {number} limit - Max results (default 5)
 * @returns {Promise<Array>}
 */
export async function searchClinicalTrials(query, filters = {}, limit = 5) {
  try {
    const params = new URLSearchParams();

    // Query fields: Condition, Intervention, Title, etc.
    params.set('query.term', query);
    params.set('pageSize', limit.toString());

    // Optional filters
    if (filters.phase) {
      params.set('filter.phase', Array.isArray(filters.phase) ? filters.phase.join(',') : filters.phase);
    }
    if (filters.status) {
      params.set('filter.overallStatus', filters.status);
    }
    if (filters.location) {
      params.set('query.locn', filters.location);
    }

    const response = await fetch(`${API_BASE}?${params}`);

    if (!response.ok) {
      throw new Error(`ClinicalTrials.gov: ${response.status}`);
    }

    const data = await response.json();
    const studies = data.studies || [];

    return studies.map(study => {
      const protocol = study.protocolSection;
      const idInfo = protocol?.identificationModule || {};
      const status = protocol?.statusModule || {};
      const design = protocol?.designInfo || {};
      const conditions = protocol?.conditionsModule?.conditions || [];

      return {
        nctId: idInfo.nctId || '',
        title: idInfo.briefTitle || '',
        officialTitle: idInfo.officialTitle || '',
        status: status?.overallStatus || '',
        phase: (Array.isArray(design?.phases) && design.phases.length > 0) ? design.phases[0] : 'Not Specified',
        studyType: design?.studyType || '',
        conditions: conditions.slice(0, 3),
        interventions: (protocol?.armsInterventionsModule?.interventions || [])
          .map(i => i.name || i.type)
          .slice(0, 3),
        enrollment: design?.enrollmentInfo || null,
        startDate: status?.startDate || '',
        completionDate: status?.completionDate || '',
        sponsor: protocol?.sponsorCollaboratorsModule?.leadSponsor?.name || '',
        source: 'ClinicalTrials.gov',
        url: `https://clinicaltrials.gov/ct2/show/${idInfo.nctId}`
      };
    });
  } catch (err) {
    console.error('ClinicalTrials.gov search failed:', err);
    return [];
  }
}

/**
 * Check if a specific drug has ongoing trials
 */
export async function searchDrugTrials(drugName, condition = '') {
  const query = `${drugName}${condition ? ' ' + condition : ''}`;
  return await searchClinicalTrials(query, {}, 3);
}

export default {
  searchClinicalTrials,
  searchDrugTrials
};
