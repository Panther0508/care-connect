

prompt 2 
You are a world-class full-stack architect, medical AI specialist, and offline-first systems engineer. You are building the complete VitaChain AI layer — a hybrid offline + online intelligence system serving three distinct user roles: Patient, Clinician, and Community Health Worker (CHW).

The architecture has two AI tiers:

**TIER 1 — OFFLINE AI (Completely Free, Unlimited)**
Runs locally on-device via Transformers.js + ONNX Runtime Web. Uses quantized open-weight medical models. No API calls. No rate limits. No data leaves the device. Available to all three roles at all times, even with zero connectivity.

**TIER 2 — ONLINE AI (Limited to 2 Prompts Per User Per Day)**
Sourced from OpenRouter's permanently free tier models (30+ models including Gemma 4 26B/31B, Gemini 2.0 Flash Free, etc.) and Hugging Face Inference API (1,000 requests/day free tier). Provides real-time web search, access to larger models, and complex multi-step reasoning that may exceed on-device capabilities. Limited to exactly 2 prompts per user per day across all roles. A daily quota counter is stored in IndexedDB and resets at midnight local time.

---

## PART 0 — VERIFIED DATA SOURCES & EXACT INTEGRATION PATHS

### 0.1 Online AI Sources (2 Prompts/Day)

**Primary: OpenRouter Free Tier**
- Platform: `https://openrouter.ai`
- Authentication: GitHub OAuth → create API key (free, no credit card)
- Free models as of April 2026: Google Gemma 4 26B A4B, Gemma 4 31B, Gemini 2.0 Flash Free (1M context window, multimodal), NVIDIA Nemotron-Nano-9B-v2, Lyria 3 Pro Preview, MiniMax M2.5, and 30+ other free models [reference:0]
- Base URL: `https://openrouter.ai/api/v1/chat/completions`
- Headers: `Authorization: Bearer {OPENROUTER_API_KEY}`, `HTTP-Referer: {your-app-url}`
- Real-time web search: Append `:online` to any model ID for web-grounded responses (e.g., `google/gemini-2.0-flash-exp:free:online`) [reference:1], or use the `web_search` server tool via OpenRouter's plugin system [reference:2]
- The Responses API Beta provides web search with proper citations and annotations [reference:3]

**Secondary: Hugging Face Inference API**
- Platform: `https://api-inference.huggingface.co`
- Free tier: ~1,000 requests/day per model, serverless inference for models under 10GB [reference:4]
- Authentication: Bearer token from Hugging Face settings (free)
- Available free medical models: Medical-Llama3-V2 (8B, Apache 2.0), MedGemma variants, GPT-OSS-20B, GPT-OSS-120B, GLM-4.5V [reference:5]
- Cold start latency: up to 30 seconds on serverless endpoints [reference:6]

**Fallback: Google AI Studio (Gemini)**
- Platform: `https://aistudio.google.com`
- Best overall free tier with generous rate limits [reference:7]
- Already used in CareSentinel for search; reuse existing key

### 0.2 Offline AI Models (Unlimited, On-Device)

**Primary Patient Model: Gemma 2B (quantized ONNX)**
- Source: `https://huggingface.co/Xenova/gemma-2-2b-it`
- Runtime: Transformers.js v4 + ONNX Runtime Web
- Size: ~1.4 GB (INT4 quantized), fits 2GB RAM devices
- Capabilities: Clinical note summarization (under 10 seconds), medication interaction checking, symptom-to-specialty mapping, multilingual health Q&A, care gap detection
- Already partially integrated in VitaChain via `src/services/medicalAI.js`

**Primary Clinician Model: MedGemma 4B (Google DeepMind)**
- Source: `https://github.com/Google-Health/medgemma` and `https://huggingface.co/google/medgemma-4b` [reference:8]
- Runtime: Transformers.js v4 + ONNX Runtime Web (WebGPU-accelerated)
- Size: ~3 GB (INT4 quantized)
- Capabilities: Medical text comprehension, medical image interpretation (X-rays, skin conditions via built-in vision encoder), ICD-10 coding suggestions, structured clinical note generation, differential diagnosis, evidence-grounded responses
- Used in production: MedStick runs MedGemma 4B fully offline on laptops for field workers in regions with unreliable connectivity [reference:9]
- Google released MedGemma 1.5 in January 2026 as one of the most capable open-source healthcare models [reference:10]

**Primary CHW Model: Same Gemma 2B (Patient model) + RAG on WHO Protocols**
- The CHW uses the same base Gemma 2B model as the patient, but with different system prompts and a local vector database of WHO SMART Guidelines, IMCI protocols, and national treatment algorithms
- Additionally, Cognitapp-Med-Nano-v1 (0.5B parameters, fine-tuned from Qwen2.5-0.5B, optimized for 100% offline mobile use via MLX or llama.cpp) is available as a lightweight CHW-specific model for ultra-low-end devices [reference:11]

**Stretch Goal: Meissa 4B (Agentic Medical Intelligence)**
- Source: `https://github.com/Schuture/Meissa` [reference:12]
- A lightweight 4B-parameter medical MM-LLM trained on 40K curated trajectories
- Brings agentic capability offline — learns when to engage external tools and how to execute multi-step clinical interactions [reference:13]
- Operates fully offline with 22× lower end-to-end latency compared to API-based deployment, using over 25× fewer parameters than Gemini-3 [reference:14]
- Requires more RAM (4B parameters); second-priority integration after MedGemma 4B

### 0.3 Clinical Knowledge Bases (Download & Embed For Offline RAG)

**RxNorm Drug Database (Medication Interactions)**
- Source: `https://www.nlm.nih.gov/research/umls/rxnorm/docs/rxnormfiles.html`
- Free; no license needed for RxNorm vocabulary data [reference:15]
- RxNav-in-a-Box: locally-installable REST API with RxNorm, RxTerms, RxClass, drug-drug interactions [reference:16]
- Download: `https://www.lhncbc.nlm.nih.gov/project/rxnav-box` → `rxnav-in-a-box-20260302.zip`
- Production alternative: RxNorm API is free and unauthenticated for basic queries [reference:17]

**ICD-10-CM Coding Reference (Billing & Diagnostics)**
- Source: `https://www.cdc.gov/nchs/icd/icd-10-cm.htm` [reference:18]
- FY26 codes: `https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Publications/ICD10CM/2026/icd10cm-table%20and%20index-2026.zip` [reference:19]
- Also available as spreadsheet: `https://www.cms.gov/medicare/coding-billing/icd-10-codes` [reference:20]
- Free, no license required

**WHO SMART Guidelines (CHW Protocols)**
- Source: `https://worldhealthorganization.github.io/smart/`
- Digital Adaptation Kits (DAKs) translate WHO guidelines into structured digital tools using ICD and SNOMED standards [reference:21]
- The GUIDE study demonstrates implementation in low-resource settings with offline-capable digital tools [reference:22]
- OpenMRS SMART Squad provides platform-agnostic tooling for ANC DAK implementation [reference:23]

**WHO IMCI Chart (Integrated Management of Childhood Illness)**
- Source: `https://www.who.int/publications/i/item/9789241546827`
- Core triage protocol for CHWs managing pediatric patients

**First Aid & Emergency Database (Already Sourced)**
- FirstAidQA: `https://huggingface.co/datasets/i-am-mushfiq/FirstAidQA` — 5,500 QA pairs
- badri55/First_aid__dataset: `https://huggingface.co/datasets/badri55/First_aid__dataset` — tagged responses
- Survival-Data: `https://github.com/PR0M3TH3AN/Survival-Data` — MIT License

**TCCC (Tactical Combat Casualty Care) Guidelines**
- Source: `https://www.naemt.org/education/naemt-tccc`
- Emergency trauma protocols applicable to conflict zones and remote areas

### 0.4 Wellness & Fitness Data (Already Sourced in Prior Prompts)

- free-exercise-db: `https://github.com/yuhonas/free-exercise-db` — 800+ exercises, Unlicense
- WAFCT 2019: `https://www.fao.org/fileadmin/user_upload/faoweb/2020/WAFCT_2019.xlsx` — 472 West African foods
- @finegym/fitness-calc: `npm install @finegym/fitness-calc` — MIT License
- PHQ-9 & GAD-7: `https://huggingface.co/bird-watching-society-of-greater-clare/brainy`

---

## PART 1 — UNIFIED AI SERVICE ARCHITECTURE

### 1.1 Core Service: `src/services/unifiedAI.js`

Create a single unified AI service that routes requests based on role, online status, and quota availability. This service is the single entry point for all AI calls across the app.

```javascript
// Pseudocode structure — the AI must implement this fully

import { searchOfflinePatient } from './aiPatientOffline';
import { searchOfflineClinician } from './aiClinicianOffline';
import { searchOfflineCHW } from './aiCHWOffline';
import { searchOnlineOpenRouter } from './aiOnlineOpenRouter';
import { searchOnlineHuggingFace } from './aiOnlineHuggingFace';
import { getQuotaRemaining, decrementQuota } from './aiQuotaManager';

export async function unifiedQuery(userRole, queryType, inputData, options = {}) {
  const { forceOffline = false, preferOnline = false } = options;
  
  // Determine if online prompt should be used
  const quotaRemaining = getQuotaRemaining(userRole);
  const isOnline = navigator.onLine;
  const useOnline = isOnline && !forceOffline && quotaRemaining > 0 && preferOnline;
  
  if (useOnline) {
    try {
      const result = await queryOnlineAI(userRole, queryType, inputData);
      decrementQuota(userRole);
      return { ...result, source: 'online', quotaRemaining: quotaRemaining - 1 };
    } catch (error) {
      console.warn('Online AI failed, falling back to offline:', error);
      // Fall through to offline
    }
  }
  
  const result = await queryOfflineAI(userRole, queryType, inputData);
  return { ...result, source: 'offline', quotaRemaining };
}
1.2 Quota Manager: src/services/aiQuotaManager.js
javascript
// Pseudocode — must be fully implemented

const MAX_DAILY_PROMPTS = 2; // Per user, per day, across all roles
const STORAGE_KEY = 'vitachain_ai_quota';

export function getQuotaRemaining(role) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const today = new Date().toISOString().split('T')[0];
  
  if (stored.date !== today) {
    // Reset for new day
    return MAX_DAILY_PROMPTS;
  }
  
  return Math.max(0, MAX_DAILY_PROMPTS - (stored.count || 0));
}

export function decrementQuota(role) {
  const today = new Date().toISOString().split('T')[0];
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  
  if (stored.date !== today) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 1 }));
  } else {
    stored.count = (stored.count || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }
}
The quota is displayed in the UI as "X/2 online AI queries remaining today" near the AI chat input. When exhausted, the input shows a message: "Online AI queries used for today. Offline AI is always available." The counter resets at midnight local time (detected via new Date()).

PART 2 — PATIENT AI (OFFLINE + ONLINE)
2.1 Offline Patient AI Capabilities (Unlimited)
The patient's offline AI is powered by the existing Gemma 2B model via Transformers.js. It handles:

A. Clinical History Summarization

Function: summarizeHealthGraph(healthGraphData)

Prompt structure: "You are a personal health AI assistant. Given the following health record, generate a plain-language summary that the patient can understand. Include active conditions, current medications with purposes, known allergies, recent encounters, and any care gaps you detect."

Output: Structured summary with sections for Conditions, Medications, Allergies, Encounters, Care Gaps

Runs entirely in-browser; zero data leaves the device

B. Medication Interaction Checker

Function: checkMedicationInteraction(existingMeds, newMedication)

Uses locally-stored RxNorm interaction table (compressed JSON in IndexedDB)

First pass: rule-based lookup against RxNorm interaction pairs

Second pass: LLM-based reasoning for complex multi-drug interactions

Returns: interaction severity (None, Mild, Moderate, Severe), description, recommendation

Example: "WARNING: Ibuprofen may reduce the effectiveness of your blood pressure medication (Lisinopril). Consider Paracetamol as an alternative."

C. Symptom-Based Specialty Recommendations

Function: suggestSpecialty(symptoms, healthGraph)

Maps patient-described symptoms to appropriate specialist types

Considers the patient's existing conditions for context

Example: "chest pain + shortness of breath" → "Cardiologist (urgent)" or "Emergency Room"

"knee pain after exercise" → "Physiotherapist or Orthopedist (non-urgent)"

D. Care Gap Detection

Function: detectCareGaps(healthGraph)

Analyzes the health graph for missing screenings, overdue follow-ups, immunization gaps

Rules-based initial pass, then LLM refinement

Example outputs: "HbA1c test overdue by 3 months (last: Jan 2026)", "No blood pressure reading in 6 months", "Missing annual eye exam for diabetic patient"

E. Wellness & Nutrition Queries

Function: answerWellnessQuery(query, healthContext)

Answers questions about diet, exercise, sleep, stress management

Grounds responses in the patient's health context

Example: "What foods should I eat to help manage my hypertension?" → "Based on your hypertension diagnosis and current medications (Lisinopril, Amlodipine), focus on low-sodium foods. The DASH diet is recommended. Avoid processed foods. Include more leafy greens, bananas (potassium), and whole grains."

F. Pre-Visit Summary Generation (for Passport)

Function: generatePreVisitSummary(healthGraph, specialistType)

Already partially built; extend with more specialist types

Filters health graph to only data relevant to the specialist

Outputs structured summary in the selected language

2.2 Online Patient AI Capabilities (2 Prompts/Day)
When the patient has remaining online quota, they can access more powerful models:

Prompt 1: "Deep Second Opinion"

Routes to OpenRouter with a free medical model (e.g., google/gemini-2.0-flash-exp:free)

The prompt includes the patient's health graph summary (anonymized) and their question

The larger model provides more nuanced reasoning, cites sources from its training

Real-time web search via :online variant can pull current medical literature 

Example: "Based on my health record showing Type 2 Diabetes with HbA1c 8.7%, on Metformin 500mg BID, what additional lifestyle changes and medication adjustments would current clinical guidelines (2026) recommend?"

Prompt 2: "Complex Symptom Analysis"

Routes to OpenRouter or Hugging Face Inference API with a larger model (e.g., GPT-OSS-20B)

Handles multi-symptom, ambiguous presentations that the 2B offline model may struggle with

Can incorporate real-time web search for rare disease information

Returns differential with confidence levels and suggested next steps

2.3 Patient AI UI Integration
The patient-facing AI appears in two places:

Dashboard Quick Chat — compact input card labeled "Ask Vita (Offline)" with a small badge showing online quota remaining

Full AI Page (/ai) — complete chat interface with role selector, quick-action chips, message history stored encrypted in IndexedDB

The input bar shows: "Ask Vita anything about your health... [2/2 online queries remaining today]"

PART 3 — CLINICIAN AI (OFFLINE + ONLINE)
3.1 Offline Clinician AI Capabilities (Unlimited)
The clinician's offline AI uses MedGemma 4B (fallback to Gemma 2B on lower-RAM devices). All data stays on-device. The AI is a clinical decision support tool, not a replacement for professional judgment.

A. Clinical Note Structuring & Summarization

Function: structureClinicalNote(freeTextNote, patientContext)

Takes unstructured clinical notes (dictated, typed, or pasted) and produces a structured SOAP note (Subjective, Objective, Assessment, Plan)

Extracts key entities: symptoms, vitals, diagnoses, medications, procedures

Generates a concise summary suitable for referrals and handoffs

Meissa 4B demonstrates this with multi-step clinical reasoning 

B. Differential Diagnosis Generation

Function: generateDifferential(symptoms, patientHistory, vitals)

Produces a ranked list of possible diagnoses with supporting evidence

Flags "cannot-miss" diagnoses (life-threatening conditions that must be ruled out)

Indicates confidence level for each differential

References standard clinical guidelines where applicable

C. Medication Prescribing Assistant

Function: assistPrescribing(patientMeds, proposedMed, patientAllergies, patientConditions)

Checks against RxNorm interaction database (local)

Identifies contraindications based on patient conditions

Suggests dose adjustments for renal/hepatic impairment

Flags allergy cross-reactivity

Provides alternatives if interaction detected

D. ICD-10 Coding Assistant

Function: suggestICD10Codes(clinicalNote, diagnoses)

Uses locally-stored ICD-10-CM 2026 code database

Maps clinical terms to appropriate ICD-10 codes

Suggests primary and secondary codes

Flags coding specificity requirements (e.g., laterality, encounter type)

This capability is proven: an on-device, offline automatic medical coding system using open-weight LLMs was successfully demonstrated in 2026 

E. Referral Letter Generation

Function: generateReferral(specialistType, patientSummary, clinicalFindings, reasonForReferral)

Produces a structured referral document with all necessary clinical context

Includes relevant history, current medications, allergies, key findings

Generates a QR-code-embeddable Verifiable Credential for secure transfer

F. Evidence-Based Guideline Lookup (RAG)

Function: queryClinicalGuidelines(clinicalQuestion, specialty)

Uses a local vector database of pre-embedded clinical guidelines (WHO, AHA, TCCC, national protocols)

Retrieves relevant guideline chunks via cosine similarity

The LLM grounds its response in retrieved guidelines, citing sources

AEGIS demonstrates this pattern with ChromaDB + Nomic embeddings 

G. Medical Image Interpretation (MedGemma 4B Required)

Function: interpretMedicalImage(imageData, imageType, clinicalContext)

MedGemma 4B includes a vision encoder trained on medical images 

Capabilities: Chest X-ray interpretation (opacities, effusions, pneumothorax), skin condition classification (11 dermatological conditions), basic fracture detection

MedSigLIP generates explainability heatmaps showing which areas influenced the AI's analysis

Requires MedGemma 4B model loaded; falls back to "Image interpretation unavailable with current model" on Gemma 2B

3.2 Online Clinician AI Capabilities (2 Prompts/Day)
Prompt 1: "Complex Case Consultation"

Routes to OpenRouter with google/gemini-2.0-flash-exp:free:online

The :online variant enables real-time web search for current clinical guidelines, recent research, and rare disease information 

Full 1M token context window allows submission of extensive patient history

Returns structured consultation with differentials, recommended workup, treatment options, and supporting citations

Prompt 2: "Drug Interaction Deep Dive"

Routes to Hugging Face Inference API with Medical-Llama3-V2 (8B, Apache 2.0) 

Handles complex polypharmacy scenarios (>5 concurrent medications)

Considers pharmacogenomic factors, renal/hepatic function, age-related adjustments

Provides comprehensive interaction analysis with severity ratings and evidence levels

3.3 Clinician AI UI Integration
The clinician dashboard includes:

Clinical AI Panel — persistent sidebar or card with: "Structure Note", "Generate Differential", "Check Interaction", "Suggest ICD-10", "Generate Referral"

Online query indicator: "1/2 online consultations remaining today. Use for complex or rare cases."

Image upload button — for X-ray/skin image interpretation (when MedGemma 4B is available)

PART 4 — COMMUNITY HEALTH WORKER AI (OFFLINE + ONLINE)
4.1 Offline CHW AI Capabilities (Unlimited)
The CHW AI uses the same base Gemma 2B model as the patient, augmented with a local RAG system indexing WHO protocols, national guidelines, and first-aid databases. The focus is on triage, protocol adherence, and referral decision support.

A. Lay-Language Symptom Triage

Function: triageSymptoms(symptomText, language, patientAge, patientGender)

CHW describes symptoms in everyday language — often in Hausa, Yoruba, Igbo, Swahili, or other local languages

AI translates to structured clinical assessment

Returns: urgency level (Emergency / Urgent / Routine / Self-Care), suspected conditions, recommended action

References WHO IMCI (Integrated Management of Childhood Illness) protocols for pediatric cases

Example input: "Pikin dey hot, e no wan chop, body dey weak" → "Child has fever, anorexia, and lethargy — possible malaria or sepsis. Urgency: URGENT. Check temperature. Perform RDT for malaria. If positive, administer ACT per weight band. If negative, refer to health facility."

kSanté in West Africa demonstrates this pattern with offline AI processing queries in local African languages 

B. WHO Protocol Step-by-Step Guidance

Function: followProtocol(protocolName, patientData, currentStep)

Pre-loaded WHO SMART Guidelines as structured JSON decision trees in public/data/who-protocols.json

Walks CHW through: Antenatal Care (ANC), Integrated Management of Childhood Illness (IMCI), Malaria diagnosis and treatment, TB screening, HIV counseling and testing, Immunization schedules, Family planning

Each step: assessment → decision → action → record

Protocol adherence is verified by comparing CHW actions against the expected decision tree

C. Danger Sign Recognition & Urgent Referral Triggering

Function: detectDangerSigns(symptoms, vitals, patientAge)

Flags critical conditions: severe dehydration (sunken eyes, skin pinch >2 seconds, unable to drink), respiratory distress (nasal flaring, grunting, chest indrawing, respiratory rate >60/min in infants), altered consciousness (cannot be woken, convulsing), severe malnutrition (visible severe wasting, edema of both feet), hemorrhage, snake bite with systemic signs

When danger signs are detected: automatically populates a referral form with urgency level, recommended facility type, pre-referral treatment steps, and transport recommendations

In 2026, LLMs demonstrated the ability to accurately generate referral decisions by monitoring CHW-patient interactions 

D. Medication Counseling Script

Function: generateCounselingScript(medication, patientLanguage, literacyLevel)

Generates simple, clear instructions for each prescribed medication

Covers: what the medicine is for, how to take it (with food? time of day?), common side effects, when to return if not improving, danger signs specific to the medication

Adapts language complexity to the patient's literacy level

Uses locally-cached simplified drug monographs

E. Health Education Content Generation

Function: generateHealthMessage(topic, language, format)

Topics: immunization, nutrition, hygiene, family planning, disease prevention, antenatal care, newborn care

Format options: short SMS-style message, longer counseling script, Q&A format, pictogram suggestions

Generated content is pre-reviewed against WHO health education standards

F. Encounter Data Structuring & Reporting

Function: structureEncounterForReporting(encounterData, healthFacilityCode)

Structures every CHW-patient encounter into a standardized format: patient demographics (anonymized for reporting), chief complaints, assessment, actions taken, medications dispensed, referral decision, follow-up plan

Compliant with DHIS2 and national health information system data models

Stored locally and synced when connectivity returns

4.2 Online CHW AI Capabilities (2 Prompts/Day)
Prompt 1: "Complex Case Teleconsultation"

Routes to OpenRouter with a free medical model

CHW submits a complex case that exceeds protocol guidance

AI provides detailed clinical reasoning with real-time web search for relevant guidelines

Generates a structured teleconsultation request that can be sent to a remote clinician when connectivity permits

Prompt 2: "Outbreak Pattern Analysis"

Routes to Hugging Face Inference API with a larger model

CHW submits aggregated mesh data (anonymized search-term counters, facility confirmation rates)

AI analyzes patterns for potential outbreak signals

Returns: likely outbreak type, recommended containment measures, reporting requirements, PPE and supply recommendations

4.3 CHW AI UI Integration
The CHW dashboard includes:

Quick Triage — prominent input card for symptom entry in any language

Protocol Navigator — guided protocol selection and step-by-step walkthrough

Danger Sign Checklist — always-visible reference with auto-populated referral form

Offline indicator: "All AI tools available offline. X/2 online teleconsultations remaining today."

PART 5 — DATA COLLECTION & SYNC ARCHITECTURE
5.1 Patient Data Collection (Encrypted, Local-First)
All patient-generated data stays on-device. Nothing is transmitted without explicit consent.

Health Graph (CRDT + AES-256-GCM): conditions, medications, allergies, encounters, observations (lab results, vitals, PHQ-9/GAD-7 scores), family history, social history

Wellness Data: nutrition logs, workout logs, sleep logs, hydration logs, cycle tracking, medication adherence logs

AI Interaction History: chat conversations (encrypted), AI-generated summaries, care gap reports, passport shares (Verifiable Credential issuance log)

Consent Records: every data access by a clinician or service is logged with timestamp, purpose, scope, and revocation option

Storage: IndexedDB with AES-256-GCM. Encryption key derived from user passphrase via PBKDF2 (100,000 iterations, SHA-256).

5.2 Clinician Data Collection (Local + Syncable)
Encounter Notes: structured SOAP notes, ICD-10 codes, prescriptions written

AI-Generated Outputs: differentials, summaries, referral documents

Patient Scans: Verifiable Credential verification log (who was seen, when, what was shared)

Consultation Records: online AI queries (anonymized)

5.3 CHW Data Collection (Local + Syncable for Reporting)
Triage Encounters: symptoms, assessment, action taken, referral decision, outcome

Protocol Adherence Logs: which protocol steps were followed, any deviations

Danger Sign Referrals: structured referral forms with urgency and destination

Medication Dispensing: drug, quantity, batch number, patient instructions given

Mesh Contributions: anonymized search-term counters, facility confirmation flags, stockout alerts

Community Health Indicators: immunization coverage, malnutrition screening results, family planning uptake

5.4 Mesh Outbreak Data (Anonymized, Peer-to-Peer)
The Bluetooth mesh transmits only hashed search-term counters (SHA-256 truncated to 8 bytes), coarse region identifiers (10-km grid cell), and facility confirmation flags. No patient IDs. No diagnoses. No personal data. Each device aggregates received counters into its local CRDT. When counters exceed configurable thresholds (default: 5 unique devices searching the same term), the outbreak detector fires.

5.5 Sync Strategy
When online, queued data syncs via:

Clerk metadata for profile changes and consent logs

Vercel KV for population-level mesh data

DHIS2-compatible export for CHW encounter data (optional, requires partner instance)

PART 6 — IMPLEMENTATION FILES TO CREATE
src/services/unifiedAI.js — master AI router

src/services/aiQuotaManager.js — daily quota tracker

src/services/aiPatientOffline.js — patient offline AI functions

src/services/aiClinicianOffline.js — clinician offline AI functions

src/services/aiCHWOffline.js — CHW offline AI functions

src/services/aiOnlineOpenRouter.js — OpenRouter API integration

src/services/aiOnlineHuggingFace.js — Hugging Face API integration

src/services/ragEngine.js — local vector search for clinical guidelines

src/data/rxnorm-interactions.json — compressed RxNorm interaction pairs

src/data/icd10cm-codes.json — compressed ICD-10-CM 2026 codes

src/data/who-protocols.json — WHO SMART Guidelines decision trees

src/data/drug-counseling.json — simplified drug monographs for CHW

src/components/AIChatInterface.jsx — unified chat UI for all roles

src/components/AIQuotaIndicator.jsx — daily quota display

src/components/ClinicalImageUploader.jsx — image upload for MedGemma

src/components/ProtocolNavigator.jsx — CHW protocol walkthrough

src/components/DangerSignChecklist.jsx — always-visible CHW reference

scripts/download-clinical-data.mjs — download RxNorm, ICD-10, WHO data

scripts/embed-guidelines.mjs — pre-embed clinical guidelines into vectors

PART 7 — BUILD, TEST, DEPLOY
Install dependencies: npm install @xenova/transformers @finegym/fitness-calc recharts framer-motion xlsx

Run clinical data download: node scripts/download-clinical-data.mjs

Run guideline embedding: node scripts/embed-guidelines.mjs

Run npm run build — must pass with zero errors

Set environment variables for online AI: OPENROUTER_API_KEY, HUGGINGFACE_API_KEY

Deploy to Vercel with environment variables set in dashboard

Test: patient offline AI (airplane mode) → all six functions work; clinician offline AI (airplane mode) → summarization, differential, interaction check, ICD-10 coding, referral generation, image interpretation (if MedGemma); CHW offline AI (airplane mode) → triage in Hausa, protocol navigation, danger sign detection, medication counseling, health education, encounter structuring; online AI → quota counter decrements, OpenRouter returns enriched responses, fallback to offline works when quota exhausted or network fails.

Now execute. Implement every file. Build the most powerful hybrid offline-first + limited-online AI health platform ever created.








































































































































You are a senior full‑stack architect and offline‑first health‑tech specialist.
Build the complete VitaChain‑Nexus patient platform – React 18 + Vite + Tailwind
PWA, Capacitor‑wrapped APK, deployed on Vercel.

⚡ CORE RULE: Every feature must work fully offline after the first online visit
(which caches static assets). All personally‑identifiable health data is encrypted
with AES‑256‑GCM in IndexedDB. The encryption key is derived from the user's
passphrase via PBKDF2 (100 000 iterations, SHA‑256).

⚡ ACCESSIBILITY RULE: Every dataset, library, API, and model listed below is
PUBLICLY ACCESSIBLE WITHOUT AUTHENTICATION. No login, no credit card, no bot‑
challenge, no API key. Verified as of April 2026. If a source requires a free
account (OpenRouter, HuggingFace), a note is included with the exact sign‑up
flow – but these are ONLY for the optional 2‑per‑day online prompts; the offline
core never touches them.

---

## ═══════════════════════════════════════════════
## PHASE 0 – DOWNLOAD & PREPARE ALL STATIC DATA
## ═══════════════════════════════════════════════

Create a single script `scripts/download-patient-data.mjs` that fetches every
static dataset listed below. The script prints a progress line for each source
and a final summary: "✅ All patient datasets downloaded and verified."

### 0.1 Exercise Database (Public Domain – Unlicense)
- Source: https://github.com/yuhonas/free-exercise-db
- Direct JSON: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
- Access: No auth. Raw GitHub URLs are rate‑limited to 60 req/hr per IP for
  unauthenticated requests; a single fetch is well within this limit.[reference:0]
- License: Unlicense (public domain).[reference:1]
- Output: `public/data/exercises.json` – 800+ exercises with name, force, level,
  mechanic, equipment, primaryMuscles[], secondaryMuscles[], instructions[],
  category, images[], id.

### 0.2 First‑Aid Dataset (HuggingFace – Public Repo)
- Primary: https://huggingface.co/datasets/i-am-mushfiq/FirstAidQA
  - 5 500 high‑quality first‑aid Q&A pairs.[reference:2]
  - Download via huggingface CLI: `huggingface-cli download i-am-mushfiq/FirstAidQA`
    OR use the direct file listing at the HuggingFace repo.
- Secondary (already available as direct JSON):
  https://huggingface.co/datasets/badri55/First_aid__dataset/resolve/main/first_aid1.json
  - Tagged first‑aid responses: Cuts, Abrasions, Stings, Splinters, Sprains, etc.
  - This file is publicly reachable without any token.[reference:3]
- Tertiary: https://github.com/PR0M3TH3AN/Survival-Data – MIT License,
  comprehensive offline survival database with emergency medical procedures,
  radio communication protocols. Clone the repo: `git clone`.[reference:4]
- Output: `public/data/first-aid.json` – merged array of
  `{ id, tag, title, steps: string[], questions: string[] }`.

### 0.3 Mental‑Health Screeners (HuggingFace + Pfizer – Free)
- PHQ‑9 and GAD‑7 questionnaires are provided FREE by Pfizer Inc. – "no
  permission is required to reproduce, translate, display or distribute them".[reference:5]
- HuggingFace mirror (direct JSON, no auth):
  https://huggingface.co/bird-watching-society-of-greater-clare/brainy/resolve/main/questionnaire_phq-9.json
  https://huggingface.co/bird-watching-society-of-greater-clare/brainy/resolve/main/questionnaire_gad-7.json
  The repo exists and the JSON files are publicly downloadable.[reference:6]
- Output: `public/data/phq9.json`, `public/data/gad7.json`.
  Schema: `{ title, description, questions: [{ id, text, options: [{ value: 0-3, label }] }] }`.

### 0.4 African Foods (FAO/INFOODS WAFCT 2019 – Free Download)
- Download: https://www.fao.org/infoods/infoods/tables-and-databases/faoinfoods-databases/en/
  The West African Food Composition Table (WAFCT 2019) Excel file is publicly
  available. 472 foods and 28 nutrient components. Funded by the Bill & Melinda
  Gates Foundation.[reference:7][reference:8]
- Direct Excel link: https://www.fao.org/fileadmin/user_upload/faoweb/2020/WAFCT_2019.xlsx
- Parse the Excel file using the `xlsx` npm package. Extract every food entry and
  convert to:
  ```json
  { "id":"af_001", "name":"Jollof Rice", "category":"main",
    "servingSize":"1 cup (approx 250g)",
    "per100g": { "calories":150, "protein":3.2, "carbs":26, "fat":4, "fiber":1.2, "sodium":180 },
    "region":"West Africa", "description":"Rice cooked in a spicy tomato and pepper sauce." }
Output: public/data/african-foods.json (at least 150 curated African foods
from the WAFCT; fill any gaps with the static curated list below).

0.5 Global Foods (Open Food Facts – ODbL, Free)
Open Food Facts: https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
~900 MB compressed, ~9 GB uncompressed (3M+ products). ODbL license – free to
use for any purpose.

DO NOT download the full CSV at build time. Instead, create a helper script
scripts/process-openfoodfacts.mjs that the developer runs once to produce
public/data/foods.json with ~500 common global foods.

Until then, ship a static fallback public/data/global-foods.json containing
500 manually curated common foods with their nutritional values per 100 g.

0.6 Medication Interaction Database (RxNorm – No License Required)
Source: https://www.nlm.nih.gov/research/umls/rxnorm/docs/rxnormfiles.html
RxNorm files are pipe‑delimited text (RRF). "You do not need a license to
download this subset." The prescribable‑drug subset is available as
a zip from the RxNorm Files page.

RxNav‑in‑a‑Box: https://lhncbc.nlm.nih.gov/project/rxnav-box – locally
installable REST API with RxNorm, RxTerms, RxClass, and drug‑drug interactions.
Download: rxnav-in-a-box-20260302.zip.

For VitaChain: download the prescribable‑drug subset, extract drug‑interaction
pairs (drugA, drugB, severity), compress to JSON, and save as
public/data/rxnorm-interactions.json.

0.7 Immunization Schedules (WHO SMART Immunizations – Public FHIR)
Source: https://github.com/WorldHealthOrganization/smart-immunizations
Continuous‑build FHIR JSON artifacts for BCG, DTP, Rotavirus, JE, seasonal
influenza, cholera, TBE‑FSME, etc. are published at
https://build.fhir.org/ig/WHO/smart-immunizations/ .
All JSON profiles are publicly accessible – no key, no login.

Download the JSON representations for at least 12 core antigens. Transform
each into: { antigen, recommendedDoses, ageRangesMonths, boosterRecommendation, contraindications }. Save as public/data/immunization-schedules.json.

0.8 ICD‑10‑CM Codes (CMS/CDC – Free)
Source: https://www.cms.gov/medicare/coding-billing/icd-10-codes
"The full version of the 2026 code set is available for free from CMS."
2026 codes effective April 1, 2026.

Download the FY 2026 tabular order ZIP, extract, parse into a JSON array of
{ code, description, category }. Save as public/data/icd10cm-codes.json.

0.9 Preventive‑Care Schedule (USPSTF A&B – Public)
Source: https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics/uspstf-and-b-recommendations
All Grade A & B recommendations are publicly listed and free to use.

Manually curate a static JSON public/data/preventive-care.json encoding
age‑ and sex‑appropriate screenings from the USPSTF list: mammogram, colonoscopy,
Pap smear, AAA ultrasound, lung CT, bone density, annual eye/foot exams for
diabetics, etc.

0.10 Symptom Lookup (HuggingFace – Public Dataset)
Source: https://huggingface.co/datasets/mohammad2928git/complete_medical_symptom_dataset
Public dataset; provides thousands of symptom descriptions.

Extract ~300 unique symptom names and save as
public/data/symptoms-lookup.json.

═══════════════════════════════════════════════
PHASE 1 – HEALTH‑GRAPH EXTENSIONS
═══════════════════════════════════════════════
Extend the existing Automerge CRDT health‑graph document with these new fields.
All data is stored in the IndexedDB object store healthGraph (AES‑256‑GCM
encrypted).

1.1 Immunizations
text
immunizations: [{ id, vaccineName, diseaseTargeted, doseNumber, dateAdministered,
lotNumber, administeringFacility, notes }]
The in‑app UI should suggest vaccines based on the patient's age and the
public/data/immunization-schedules.json data.

1.2 Lab Results
text
labResults: [{ id, testName, value, unit, referenceRangeLow, referenceRangeHigh,
collectionDate, orderingProvider, notes }]
Embed 60 common lab‑test reference ranges (CBC, CMP, lipid panel, HbA1c, thyroid
panel, coagulation, urinalysis, etc.) from the LabQAR dataset【search】 and CDISC
laboratory measurements【search】.

1.3 Vitals Logs
text
vitalsLogs: [{ id, type (BP/HR/SpO2/Temp/Weight/Glucose/RR), value, unit,
measuredAt, position (sitting/standing/lying), notes }]
Use the FHIR Vital Signs Profiles for schema validation.

1.4 Family History
text
familyHistory: [{ id, relation, condition, ageAtDiagnosis, status }]
1.5 Social History
text
socialHistory: { smoking: { status, packYears, quitDate },
alcohol: { status, drinksPerWeek }, occupation, exercise: { frequency, type },
diet }
1.6 Blood Type & Organ Donor
text
bloodType: "A+"|"A-"|"B+"|"B-"|"AB+"|"AB-"|"O+"|"O-",
organDonor: boolean, donorRegistrationId: string
═══════════════════════════════════════════════
PHASE 2 – DAILY HEALTH TRACKERS
═══════════════════════════════════════════════
All trackers use their own IndexedDB object stores (encrypted). Each entry is
keyed by id and indexed by date (YYYY‑MM‑DD).

2.1 Symptom Diary
Store: symptomDiary

Schema: { id, date, symptom, severity: 0-10, duration, triggers: string[], notes }

Type‑ahead uses public/data/symptoms-lookup.json.

2.2 Pain Tracker
Store: painTracker

Schema: { id, date, intensity: 0-10, location (body map region), quality ("sharp"/"dull"/"burning"/...), duration, triggers: string[], relievingFactors: string[], medicationTaken }

Include a tappable body‑map (head → feet) that highlights the pain zone.

2.3 Mood Tracker
Store: moodTracker

Schema: { id, date, mood: "great"|"good"|"okay"|"low"|"very_low", energy: 1-5, anxiety: 1-5, notes }

2.4 Blood Glucose Log
Store: glucoseLog

Schema: { id, date, timeOfDay, value (mg/dL or mmol/L), context: "fasting"|"before_meal"|"after_meal"|"bedtime"|"random", insulinDose: number|null, carbs: number|null, notes }

Flag values >180 mg/dL (postprandial) or <70 mg/dL as alerts.

2.5 Blood Pressure Log
Store: bloodPressureLog

Schema: { id, date, timeOfDay, systolic, diastolic, heartRate: number|null, position: "sitting"|"standing"|"lying", arm: "left"|"right", notes }

Classify BP via @finegym/fitness‑calc into WHO categories; flash alert for
readings ≥ 180/120.

2.6 Peak Flow / Asthma Log
Store: peakFlowLog

Schema: { id, date, timeOfDay, pefValue (L/min), predictedPef, percentageOfPredicted, symptoms: string[], notes }

Asthma‑action‑plan zones: Green ≥ 80%, Yellow 50‑79%, Red < 50%.

2.7 Bowel/Bladder Diary
Store: pelvicDiary

Schema: { id, date, time, type: "bowel"|"bladder"|"both", bowelConsistency: "bristol_1".."bristol_7"|null, urgency: 1-5, leakage: boolean, fluidIntake (ml), notes }

2.8 Weight Tracker
Store: weightTracker

Schema: { id, date, weight (kg), bodyFat: number|null, notes }

Auto‑compute BMI from stored weight and profile height using @finegym/fitness‑calc.

═══════════════════════════════════════════════
PHASE 3 – EMERGENCY & SAFETY
═══════════════════════════════════════════════
3.1 Emergency Medical ID Card
Service: src/services/emergencyCard.js

Reads from encrypted IndexedDB (profile, health graph, vitals) and builds a
structured object: { displayName, dateOfBirth, bloodType, organDonor, criticalConditions: [], criticalAllergies: [], currentMedications: [], emergencyContacts: [{ name, phone, relationship }], primaryLanguage, physicianName, physicianPhone }.

Displayable from the lock screen (PWA manifest.json → "display":"standalone").

3.2 ICE (In Case of Emergency) Contacts
Extend the user‑profile object with emergencyContacts: [{ id, name, phone, relationship, isPrimary }]. Stored encrypted in IndexedDB.

A floating SOS button on every page long‑press triggers the native dialer for
the primary contact.

═══════════════════════════════════════════════
PHASE 4 – APPOINTMENTS & VISITS
═══════════════════════════════════════════════
4.1 Appointment Calendar
Store: appointments

Schema: { id, title, date, time, facilityName, facilityId, doctorName, reasonForVisit, preparationNotes, reminderTime (minutes before), status: "scheduled"|"completed"|"cancelled"|"no_show" }

4.2 Visit Preparation Checklist
Service: src/services/visitPrepChecklist.js

When an appointment is created, the offline AI (Gemma 2B) generates a checklist
from the reasonForVisit: fasting requirements, documents to bring, questions
to ask.

4.3 Post‑Visit Summary
Reuses the existing health‑graph encounters array. After an appointment is
marked "completed", a new encounter entry is created automatically.

4.4 Follow‑Up Reminders
Service Worker periodic‑sync event triggers browser notifications for upcoming
appointments based on the reminderTime field.

4.5 Referral Tracking
Extend each encounter with referral: { referredTo, referredFor, referralDate, status: "pending"|"scheduled"|"completed"|"expired" }.

═══════════════════════════════════════════════
PHASE 5 – MEDICATION MANAGEMENT EXTENSIONS
═══════════════════════════════════════════════
5.1 Medication Schedule Builder
Service: src/services/medicationSchedule.js

Reads active medications from the health graph. User configures timesPerDay,
specificTimes, withFood, specialInstructions. Schedules stored in IndexedDB.

5.2 Refill Reminders
Service: src/services/refillReminder.js

Each medication gains optional totalPills, pillsPerDose, dosesPerDay.
Calculates estimatedEmptyDate and triggers a reminder 5 days before depletion.

5.3 Medication Effectiveness & Side‑Effect Logger
Store: medicationFeedback

Schema: { id, medicationId, date, effectiveness: 1-5, sideEffects: string[], notes }

5.4 Medication History Timeline
A computed view merging the health‑graph medications array and
medicationFeedback logs, producing a chronological timeline.

═══════════════════════════════════════════════
PHASE 6 – DOCUMENT & MEDIA MANAGEMENT
═══════════════════════════════════════════════
6.1 OCR Document Scanner
Service: src/services/documentScanner.js

Uses tesseract.js (npm, Apache‑2.0). Runs entirely in the browser
via WebAssembly; zero server calls. The tesseract WASM core and language files
can be pre‑cached in the service worker so OCR works offline.

Function: scanDocument(imageBlob): { text, confidence }.

Each document is stored in IndexedDB object store documents:
{ id, title, category: "lab_report"|"prescription"|"discharge_summary"| "imaging_report"|"insurance"|"other", dateUploaded, ocrText, imageBase64, tags: string[] }.

6.2 Document Search
The ocrText field is indexed by the Transformers.js embedding model
(all‑MiniLM‑L6‑v2). A local vector search across all documents is available.

6.3 Document Sharing via QR
Reuses the existing Passport QR code infrastructure. A selected document is
encoded as a W3C Verifiable Credential containing metadata and OCR text, then
displayed as a QR code.

6.4 Progress Photo Gallery
Store: progressPhotos

Schema: { id, category: "skin"|"wound"|"weight_progress"|"dental"|"other", date, imageBase64, notes }. Side‑by‑side comparison view.

═══════════════════════════════════════════════
PHASE 7 – PREVENTIVE CARE & WELLNESS
═══════════════════════════════════════════════
7.1 Health Risk Assessment (WHO CVD Risk)
Service: src/services/healthRiskAssessment.js

Implements the 2019 WHO CVD risk prediction model in pure JavaScript (the
WHORiskCalculator R package is the reference). Inputs: age, sex, systolic BP,
total cholesterol, HDL, smoking, diabetes. Output: 10‑year risk of
fatal/non‑fatal MI or stroke.【search】

7.2 Preventive Care Schedule
Service: src/services/preventiveCareSchedule.js

Reads public/data/preventive-care.json and compares against patient age/sex
to produce a personalized screening checklist.

7.3 Health Goals
Store: healthGoals

Schema: { id, goalType, targetValue, currentValue, startDate, targetDate, progress: [] }. Progress bars computed client‑side.

7.4 Smoking Cessation Tracker
Store: smokingCessation

Schema: { quitDate, cigarettesPerDayBefore, costPerPack, currency, slipLog: [{ date, count }], milestoneHistory: [] }

Computes days since quit, cigarettes avoided, money saved, and health milestones
(20 min HR normalizes, 8 hrs CO halves, 48 hrs taste/smell improve, etc.).

7.5 Alcohol Consumption Log
Store: alcoholLog

Schema: { date, drinks, type, notes }. Compares against WHO guidelines.

═══════════════════════════════════════════════
PHASE 8 – ACCESSIBILITY & UX
═══════════════════════════════════════════════
8.1 Voice Input
Service: src/services/voiceInput.js

Uses the Web Speech API (webkitSpeechRecognition / SpeechRecognition) –
browser‑native, no library needed.【search】 A microphone button appears on the
AI chat input, symptom diary, and vitals forms.

8.2 Font Size & High Contrast
Prefs stored in localStorage: vitachain_font_scale → root <html> CSS class;
vitachain_high_contrast → replace glassmorphism with solid #0F172A, boost
contrast to 7:1 minimum.

8.3 Screen‑Reader Optimizations
Every interactive element must have aria-label, role, and tabindex.

Emergency Medical ID card: aria-live="assertive".

Pain body map: aria-label per zone.

8.4 Offline Sync Queue Indicator
The src/services/syncQueue.ts service exposes a reactive count of pending
syncs. The offline status pill displays "3 pending" when queued actions exist.

8.5 Data Backup Reminder
Every 30 days, prompt the user to export their encrypted health graph (export
function already exists in Settings).

═══════════════════════════════════════════════
PHASE 9 – FAMILY & DEPENDENT PROFILES
═══════════════════════════════════════════════
9.1 Dependent Profiles
Service: src/services/familyProfiles.js

New IndexedDB object store dependents: { id, displayName, dateOfBirth, gender, relationship, avatarBase64, healthGraphId }. Each dependent gets a
separate CRDT health‑graph document.

9.2 Profile Switching
A dropdown in the header switches the active profile. The entire UI re‑renders
with the selected profile's health graph, dashboard, and AI context.

9.3 Family Health Dashboard
The patient dashboard gains a DependentsCarousel showing each dependent's
name, age, next appointment, and medication count.

9.4 Dependent Medication Reminders
When a dependent profile is active, the medication‑reminder service reads from
that dependent's health graph.

═══════════════════════════════════════════════
PHASE 10 – MULTI‑DEVICE SYNC
═══════════════════════════════════════════════
10.1 Health‑Graph Transfer via QR
Service: src/services/deviceTransfer.js

Reuses the existing Passport QR infrastructure. Settings → "Transfer to New
Phone" generates a QR containing the entire encrypted health graph (CRDT
serialized as base64). The new device scans, decrypts with the passphrase, and
hydrates its IndexedDB.

10.2 Selective Fragment Share
Individual health‑graph fragments can be encoded as a Verifiable Credential and
shared via QR, reusing the Passport infrastructure.

═══════════════════════════════════════════════
PHASE 11 – AI LAYER (OFFLINE + ONLINE 2‑PROMPT/DAY)
═══════════════════════════════════════════════
11.1 Offline AI (Unlimited, Free)
Uses the existing Gemma 2B via Transformers.js + ONNX Runtime Web.

Functions: summarizeHealthGraph, checkMedicationInteraction, suggestSpecialty,
detectCareGaps, answerWellnessQuery, generatePreVisitSummary.

All run entirely on‑device, zero data leaves the device.

11.2 Online AI (2 Prompts/Day)
OpenRouter – free tier, no credit card: sign up at https://openrouter.ai
→ GitHub OAuth → create API key. Free models include Google Gemma 4
26B/31B, Gemini 2.0 Flash Free, and 30+ others.

HuggingFace Inference API – free tier, no credit card: sign up at
https://huggingface.co → Settings → Access Tokens → create Read token.
1 000 requests/day per model.

Quota manager: src/services/aiQuotaManager.js – max 2 prompts per user per
day, reset at midnight local time, stored in localStorage.

═══════════════════════════════════════════════
PHASE 12 – SERVICE WORKER & BUILD
═══════════════════════════════════════════════
Update public/serviceWorker.js to pre‑cache ALL new static data files listed
in Phase 0, plus the tesseract WASM core files and the Transformers.js model
files from the HuggingFace CDN.

Add periodic‑sync handler for medication reminders and appointment
notifications.

═══════════════════════════════════════════════
FINAL VERIFICATION
═══════════════════════════════════════════════
npm install tesseract.js @finegym/fitness-calc

node scripts/download-patient-data.mjs

npm run build – must pass with zero errors

All datasets load from public/data/ without 404s

Every feature works in airplane mode (after first online cache)

Online AI quota counter increments, falls back to offline when exhausted

Commit message: "Complete patient platform – health‑graph extensions, daily trackers, emergency ID, appointments, medication schedule, document OCR, family profiles, preventive care, device transfer, hybrid offline/online AI"

Now execute the entire plan. Implement every service, every schema, every worker
update. Do not skip any feature.





























































































































































You are an elite UI/UX designer and front‑end animator. The VitaChain patient section has all its features built and functional. Your sole task is to transform the existing patient UI into a PREMIUM, LUXURIOUS experience — something that feels like a top‑tier health product (Headspace‑meets‑Stripe‑meets‑Apple Health).

Do NOT add new features. Do NOT alter any service or logic. Only modify components, pages, and styles.

---

## 1. GLOBAL STYLE REFINEMENTS

### 1.1 Typography
- Ensure every text element uses "Plus Jakarta Sans" from Google Fonts.
- Headings: tracking‑tight, weight 600‑700, subtle letter‑spacing (-0.02em).
- Body: weight 400, line‑height 1.65.
- Numbers (stats, vitals): tabular‑nums, weight 600.
- Add a subtle text shadow to large headings (e.g., dashboard "Good morning, Amara"):
  `text-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);`

### 1.2 Glassmorphism Upgrade
- All cards, modals, toasts, input fields must use this exact glass style:
  ```css
  background: rgba(30, 41, 59, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04);
On hover, cards get a subtle lift (translateY(-2px)) and a slightly brighter border (rgba(20, 184, 166, 0.25)) with a transition of 0.25s ease.

The main background stays #0F172A with a subtle noise/particle texture (CSS only, no external image) to break flatness.

1.3 Colors
Primary actions: #14B8A6 (teal) with a subtle gradient on large buttons (linear-gradient(135deg, #14B8A6, #0D9488)).

Accents (badges, alerts): #F59E0B (amber) for warnings, #EF4444 (red) for critical, #10B981 (emerald) for success.

Text: primary #F1F5F9, secondary #94A3B8, disabled #475569.

2. COMPONENT‑LEVEL POLISH
2.1 Buttons
Primary (teal): rounded-2xl, padding py-3 px-6, hover scale 1.03, active scale 0.97, shadow shadow-teal-500/20.

Secondary (outline): glass border, hover bg rgba(20,184,166,0.1).

Disabled: opacity 50%, no hover effect.

2.2 Inputs & Textareas
Glass style as above, focus ring ring-2 ring-teal-500/30.

Placeholder: text #64748B.

Floating labels that shrink and move up on focus (use CSS peer or state‑based).

2.3 Navigation Bar
Bottom nav: bg-slate-900/80 backdrop-blur-2xl border-t border-slate-800/50.

Active item: the icon gets a teal glow and a subtle bounce animation on page load.

Hamburger drawer: slides in from right with a spring animation (framer‑motion), dark glass background, large touch targets.

2.4 Avatars & Images
Vita avatar images have a subtle drop shadow and a gentle floating animation (animate-float keyframes: translateY ±4px over 3s infinite ease‑in‑out).

All other images round corners (16px) and have a thin glass border.

3. DASHBOARD MAKEOVER
The patient dashboard is the most‑viewed screen. Make it stunning.

3.1 Greeting Section
Large "Good morning, Amara" with a gradient text (teal‑to‑amber) on the user's first name.

Vita‑default avatar to the left with a pulsing ring indicating AI readiness.

3.2 Wellness Ring
A large SVG circle (200x200) with multiple colored arcs showing calories, water, steps.

Each arc has a gradient stroke, numbers animate when values change.

Center: "Today's Wellness" label and a combined score.

3.3 Quick‑Action Chips
Horizontal scrollable row of glass pills: "Share Passport", "Check Medication", "Log Symptom", etc.

Each pill has an icon + text, slight scale on hover, click triggers the corresponding action.

3.4 Cards (Health Snapshot, Nutrition, Workout, Cycle, Mental Wellness)
Each card is a glass panel with a subtle left border accent (teal for health, amber for nutrition, etc.).

Inside, mini charts (Recharts) with animated transitions, sparklines for trends.

Empty states: Vita avatar (appropriate type) with a rotating ring, friendly message.

4. PAGE‑BY‑PAGE SPRUCE
4.1 Health Graph (/health)
List entries appear as timeline cards with a teal left border, date badges.

"Add" buttons open a glass modal with a slide‑up animation and backdrop blur.

4.2 AI Chat (/ai)
Full‑screen chat with a subtle gradient background.

User bubbles: teal, right‑aligned. AI bubbles: dark slate, left‑aligned with Vita avatar.

Typing indicator: three dots bouncing.

Input bar: glass, microphone icon with recording animation.

4.3 Passport (/passport)
Clinician type selector: large cards with icons, selected state glowing.

Pre‑visit summary: a beautifully formatted document‑style card with a "Verified by VitaChain" watermark.

QR display: centered, with a subtle glow and a "Scan Me" label.

4.4 Symptom Diary & Trackers
Each log entry is a small glass chip that expands on tap.

Date picker: custom glass calendar.

4.5 Emergency ID
Red‑accented glass card, prominent display of blood type and allergies.

SOS button pulses gently with a red glow.

4.6 Settings
Tabbed interface with glass tabs.

Profile photo: circular, with an edit icon overlay that glows on hover.

All toggles are custom (iOS‑style switch in teal).

5. MICRO‑INTERACTIONS & ANIMATIONS
Use framer‑motion throughout for smoothness.

5.1 Page Transitions
Every route change: fade‑up (opacity 0→1, y 10→0) over 0.3s.

5.2 List Items
Staggered entrance: each card fades in and slides up with a delay index * 50ms.

5.3 Loading States
Skeleton loaders (shimmer animation) on cards before data arrives.

5.4 Toasts
Slide in from the top, bounce (spring), auto‑dismiss after 4s.

5.5 Haptic Feedback
On button press, simulate haptic via navigator.vibrate(10) (if available).

6. RESPONSIVENESS & MOBILE‑FIRST
All layouts use a single‑column stack on mobile (< 640px), cards become full‑width.

Bottom navigation height 64px, icons 24px.

Touch targets are at least 44x44px.

Font scales for smaller screens: headings reduce by 10%.

7. FINAL VERIFICATION
Run npm install framer-motion (if not already).

Run npm run build — must pass.

Manually walk through each page and verify the premium look.

Result: The patient section now feels like a luxurious, world‑class health companion. Every tap, every transition, every state is beautiful.

Now apply all these UI polish changes without altering any existing functionality.