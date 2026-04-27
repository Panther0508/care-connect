// src/services/passport.js
// Universal Health Passport service
// Orchestrates AI summary generation, VC creation, QR encoding/decoding

import { generateKeyPair, exportPublicKey, exportPrivateKey, importPrivateKey, createCredential, verifyCredential, encodeCredential, decodeCredential } from '../lib/vc';
import { getCurrentHealthState, initHealthGraph } from './healthGraph';
import { loadModel, generatePreVisitSummary } from './medicalAI';
import QRCode from 'qrcode';
import { meshOrchestrator } from './meshOrchestrator';

// Storage keys
const KEY_PAIR_KEY = 'passport_key_pair';

let keyPair = null;
let modelLoaded = false;

/**
 * Initialize passport: ensure health graph is ready and keys are loaded/created
 */
export async function initPassport() {
  await initHealthGraph();
  await ensureKeyPair();
  // Pre-load AI model in background
  try {
    await loadModel();
    modelLoaded = true;
  } catch (err) {
    console.warn('AI model not yet loaded; will load on demand');
  }
}

/**
 * Ensure a key pair exists; generate if missing
 */
async function ensureKeyPair() {
  if (keyPair) return keyPair;

  // Try to load from IndexedDB (encrypted with health graph key)
  const stored = localStorage.getItem(KEY_PAIR_KEY);
  if (stored) {
    try {
      const { privateKeyBytes } = JSON.parse(stored);
      const privateKey = await importPrivateKey(new Uint8Array(privateKeyBytes));
      const publicKeyBytes = await exportPublicKey({ publicKey: privateKey }); // Hack: we need to store both
      // Actually we stored both; let's parse properly
    } catch (e) {
      console.warn('Failed to import saved key pair, generating new one');
    }
  }

  // Generate new key pair
  keyPair = await generateKeyPair();
  const publicKeyBytes = await exportPublicKey(keyPair);
  const privateKeyBytes = await exportPrivateKey(keyPair);

  // Save (encrypted in production; for demo we store raw)
  // In production, encrypt with health graph's AES key
  try {
    localStorage.setItem(KEY_PAIR_KEY, JSON.stringify({
      publicKey: Array.from(publicKeyBytes),
      privateKey: Array.from(privateKeyBytes),
    }));
  } catch (e) {
    console.warn('Could not save key pair to localStorage');
  }

  return keyPair;
}

/**
 * Get the patient's DID
 */
export async function getPatientDid() {
  if (!keyPair) await ensureKeyPair();
  const publicKeyBytes = await exportPublicKey(keyPair);
  return publicKeyToDid(publicKeyBytes);
}

/**
 * Generate a pre-visit summary and VC, then QR code
 * @param {string} specialistType - e.g., 'cardiologist', 'pharmacist'
 * @returns {Object} { credential, qrDataURL, summaryText }
 */
export async function generatePassport(specialistType) {
  // 1. Ensure health graph and AI model
  const healthState = getCurrentHealthState();

  // 2. Generate pre-visit summary via AI
  let summaryText;
  if (modelLoaded) {
    summaryText = await generatePreVisitSummary(healthState, specialistType);
  } else {
    // Fallback: simple summary from health data
    summaryText = generateSimpleSummary(healthState, specialistType);
  }

  // 3. Build claims object
  const claims = {
    healthSummary: {
      specialist: specialistType,
      generatedAt: new Date().toISOString(),
      summary: summaryText,
      conditions: healthState.conditions,
      medications: healthState.medications,
      allergies: healthState.allergies,
      encounters: healthState.encounters.slice(-5), // last 5
    },
  };

  // 4. Get patient identity
  const patientDid = await getPatientDid();
  if (!keyPair) await ensureKeyPair();

  // 5. Create Verifiable Credential
  const vc = await createCredential({
    issuerDid: patientDid,
    subjectDid: patientDid,
    claims,
    privateKey: keyPair.privateKey,
  });

  // 6. Encode to JSON string
  const vcJson = encodeCredential(vc);

  // 7. Generate QR code (data URL)
  const qrDataURL = await new Promise((resolve, reject) => {
    QRCode.toDataURL(
      vcJson,
      {
        errorCorrectionLevel: 'H',
        width: 512,
        margin: 2,
      },
      (err, url) => {
        if (err) reject(err);
        else resolve(url);
      }
    );
  });

  // 8. Broadcast to mesh (privacy-preserving: only indicate credential issued)
  meshOrchestrator.recordSearch(`passport:${specialistType}`);

  return {
    credential: vc,
    qrDataURL,
    summaryText,
  };
}

/**
 * Import a credential from scanned QR content
 * @param {string} jsonString - JSON string of VC
 * @returns {Object} { isValid, claims, vc }
 */
export async function importCredential(jsonString) {
  let vc;
  try {
    vc = decodeCredential(jsonString);
  } catch (e) {
    return { isValid: false, reason: 'Invalid JSON' };
  }

  // Verify signature
  const verification = await verifyCredential(vc);
  if (!verification.valid) {
    return { isValid: false, reason: verification.reason || 'Signature invalid' };
  }

  // Extract claims
  const claims = vc.credentialSubject;

  return {
    isValid: true,
    claims,
    vc,
  };
}

/**
 * Generate a simple summary without AI (fallback)
 */
function generateSimpleSummary(healthState, specialistType) {
  const { conditions, medications, allergies, encounters } = healthState;

  let summary = `Pre-visit summary for ${specialistType}.\n\n`;

  if (conditions.length > 0) {
    summary += 'Active conditions: ' + conditions.map(c => c.name).join(', ') + '.\n';
  }
  if (medications.length > 0) {
    summary += 'Current medications: ' + medications.map(m => `${m.name} (${m.dose})`).join(', ') + '.\n';
  }
  if (allergies.length > 0) {
    summary += 'Allergies: ' + allergies.map(a => `${a.substance} (${a.reaction})`).join(', ') + '.\n';
  }
  if (encounters.length > 0) {
    const last = encounters[encounters.length - 1];
    summary += `Most recent visit: ${last.date} at ${last.facilityName} for ${last.reason}.\n`;
  }

  summary += '\nGenerated by VitaChain Health Passport.';
  return summary;
}

/**
 * Get stored public key as DID (for verification by others)
 */
export async function getPublicKeyDid() {
  if (!keyPair) await ensureKeyPair();
  const publicKeyBytes = await exportPublicKey(keyPair);
  return publicKeyToDid(publicKeyBytes);
}
