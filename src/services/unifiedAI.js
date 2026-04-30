import { searchOfflinePatient } from "./aiPatientOffline";
import { searchOfflineClinician } from "./aiClinicianOffline";
import { searchOfflineCHW } from "./aiCHWOffline";
import { queryOpenRouter } from "./aiOnlineOpenRouter";
import { queryHuggingFace } from "./aiOnlineHuggingFace";
import { getQuotaRemaining, decrementQuota } from "./aiQuotaManager";

export const USER_ROLES = { PATIENT: "patient", CLINICIAN: "clinician", CHW: "chw" };
export const QUERY_TYPES = { SUMMARIZE_HEALTH: "summarize_health", CHECK_INTERACTIONS: "check_interactions", SUGGEST_SPECIALTY: "suggest_specialty", DETECT_CARE_GAPS: "detect_care_gaps", WELLNESS_ADVICE: "wellness_advice", PRE_VISIT_SUMMARY: "pre_visit_summary", STRUCTURE_NOTE: "structure_note", GENERATE_DIFFERENTIAL: "generate_differential", ASSIST_PRESCRIBING: "assist_prescribing", SUGGEST_ICD10: "suggest_icd10", GENERATE_REFERRAL: "generate_referral", QUERY_GUIDELINES: "query_guidelines", INTERPRET_IMAGE: "interpret_image", TRIAGE_SYMPTOMS: "triage_symptoms", FOLLOW_PROTOCOL: "follow_protocol", DETECT_DANGER_SIGNS: "detect_danger_signs", COUNSELING_SCRIPT: "counseling_script", HEALTH_EDUCATION: "health_education", STRUCTURE_ENCOUNTER: "structure_encounter", SECOND_OPINION: "second_opinion", COMPLEX_CASE: "complex_case" };

export async function unifiedQuery(userRole, queryType, inputData, options = {}) {
  const { forceOffline = false, preferOnline = false, language = "en", context = {}, imageData = null } = options;
  const quotaRemaining = getQuotaRemaining(userRole);
  const isOnline = typeof navigator !== "undefined" && navigator.onLine;
  let result, source = "offline";
  if (isOnline && !forceOffline && quotaRemaining > 0 && preferOnline) {
    try {
