import { generateKeyPair, exportPublicKey, exportPrivateKey, importPrivateKey, createCredential, verifyCredential, encodeCredential, decodeCredential } from '../lib/vc';
import { getCurrentHealthState, initHealthGraph, setActiveUser } from './healthGraph';
import { loadModel, generatePreVisitSummary } from './medicalAI';
import QRCode from 'qrcode';
import { meshOrchestrator } from './meshOrchestrator';
import { addPassportShare, addPassportScan, getFoodLogsForRange } from '../lib/idb';

let keyPair = null;
let modelLoaded = false;

export async function initPassport(userId?: string, passphrase = 'vita-demo-2026'): Promise<void> {
  await initHealthGraph();
  // Only set active user if userId is provided (preserves current user for dev/bypass scenarios)
  if (userId !== undefined) {
    await setActiveUser(userId, passphrase);
  }
  await ensureKeyPair();
  try {
    await loadModel();
    modelLoaded = true;
  } catch (err) {
    console.warn('AI model not yet loaded; will load on demand');
  }
}

async function ensureKeyPair() {
  if (keyPair) return keyPair;

  const stored = localStorage.getItem('passport_key_pair');
  if (stored) {
    try {
      const { publicKey, privateKey } = JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to import saved key pair, generating new one');
    }
  }

  keyPair = await generateKeyPair();
  const publicKeyBytes = await exportPublicKey(keyPair);
  const privateKeyBytes = await exportPrivateKey(keyPair);

  try {
    localStorage.setItem('passport_key_pair', JSON.stringify({
      publicKey: Array.from(publicKeyBytes),
      privateKey: Array.from(privateKeyBytes),
    }));
  } catch (e) {
    console.warn('Could not save key pair to localStorage');
  }

  return keyPair;
}

export async function getPatientDid() {
  if (!keyPair) await ensureKeyPair();
  const publicKeyBytes = await exportPublicKey(keyPair);
  return publicKeyToDid(publicKeyBytes);
}

export async function generatePassport(specialistType, userId) {
  // Ensure health graph is loaded for this user
  await initPassport(userId);

  const healthState = getCurrentHealthState();

  let summaryText;
  if (modelLoaded) {
    summaryText = await generatePreVisitSummary(healthState, specialistType);
  } else {
    summaryText = generateSimpleSummary(healthState, specialistType);
  }

  // Fetch recent nutrition data (last 7 days)
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const startDate = weekAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  let nutritionSummary = null;
  try {
    const foodLogs = await getFoodLogsForRange(userId, startDate, endDate);
    if (foodLogs.length > 0) {
      const totals = foodLogs.reduce(
        (acc, log) => ({
          totalCalories: acc.totalCalories + (log.calories || 0),
          totalProtein: acc.totalProtein + (log.protein || 0),
          totalCarbs: acc.totalCarbs + (log.carbs || 0),
          totalFat: acc.totalFat + (log.fat || 0),
          totalFiber: acc.totalFiber + (log.fiber || 0),
          mealCount: acc.mealCount + 1,
        }),
        { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0, mealCount: 0 }
      );
      nutritionSummary = {
        period: `Last 7 days (${startDate} to ${endDate})`,
        ...totals,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch nutrition data for passport:', err);
  }

  const claims = {
    healthSummary: {
      specialist: specialistType,
      generatedAt: new Date().toISOString(),
      summary: summaryText,
      conditions: healthState.conditions,
      medications: healthState.medications,
      allergies: healthState.allergies,
      encounters: healthState.encounters.slice(-5),
      nutrition: nutritionSummary,
    },
  };

  const patientDid = await getPatientDid();
  if (!keyPair) await ensureKeyPair();

  const vc = await createCredential({
    issuerDid: patientDid,
    subjectDid: patientDid,
    claims,
    privateKey: keyPair.privateKey,
  });

  const vcJson = encodeCredential(vc);

  // QR size safeguard: if VC JSON exceeds ~1800 chars, create a lightweight version without proof signature
  let qrDataURL = '';
  try {
    qrDataURL = await generateQRCode(vcJson);
  } catch (qrErr) {
    console.warn('Full VC too large for QR, creating lightweight version');
    // Create lightweight credential (no proof, minimal fields)
    const lightweight = {
      '@context': vc['@context'],
      type: vc.type,
      issuer: vc.issuer,
      issuanceDate: vc.issuanceDate,
      credentialSubject: vc.credentialSubject,
    };
    qrDataURL = await generateQRCode(JSON.stringify(lightweight));
  }

  await addPassportShare({
    userId,
    specialistType,
    credential: vc,
    qrDataUrl: qrDataURL,
    timestamp: new Date().toISOString(),
  });

  meshOrchestrator.recordSearch(`passport:${specialistType}`);

  return {
    credential: vc,
    qrDataURL,
    summaryText,
  };
}

// Helper to generate QR code with proper error handling
async function generateQRCode(data) {
  return new Promise((resolve, reject) => {
    const MAX_QR_SIZE = 2953; // Max capacity for version 40, H level (approx 2953 alphanumeric)
    if (data.length > MAX_QR_SIZE) {
      reject(new Error(`Data too large for QR code: ${data.length} chars`));
      return;
    }
    QRCode.toDataURL(
      data,
      { errorCorrectionLevel: 'H', width: 512, margin: 2 },
      (err, url) => {
        if (err) reject(err);
        else resolve(url);
      }
    );
  });
}

export async function importCredential(jsonString, clinicianId) {
  let vc;
  try {
    vc = decodeCredential(jsonString);
  } catch (e) {
    return { isValid: false, reason: 'Invalid JSON' };
  }

  const verification = await verifyCredential(vc);
  if (!verification.valid) {
    return { isValid: false, reason: verification.reason || 'Signature invalid' };
  }

  const claims = vc.credentialSubject;

  if (clinicianId) {
    await addPassportScan({
      clinicianId,
      patientDid: vc.credentialSubject.id,
      summary: claims.healthSummary?.summary,
      specialistType: claims.healthSummary?.specialist,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    isValid: true,
    claims,
    vc,
  };
}

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

export async function getPublicKeyDid() {
  if (!keyPair) await ensureKeyPair();
  const publicKeyBytes = await exportPublicKey(keyPair);
  return publicKeyToDid(publicKeyBytes);
}
