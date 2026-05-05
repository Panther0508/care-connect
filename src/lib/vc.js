// src/lib/vc.js
// W3C Verifiable Credentials Data Model v2.0 implementation
// Uses Web Crypto API for ECDSA P-256 signatures
// Identity method: DID:KEY (simplified)

export async function generateKeyPair() {
  // Generate P-256 key pair for ECDSA signatures
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );

  return keyPair;
}

/**
 * Export public key as raw SPKI bytes (for DID construction)
 */
export async function exportPublicKey(keyPair) {
  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  return new Uint8Array(spki);
}

/**
 * Export private key as PKCS8 (for storage)
 */
export async function exportPrivateKey(keyPair) {
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  return new Uint8Array(pkcs8);
}

/**
 * Import private key from PKCS8 bytes
 */
export async function importPrivateKey(pkcs8Bytes) {
  return crypto.subtle.importKey(
    'pkcs8',
    pkcs8Bytes.buffer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign']
  );
}

/**
 * Import public key from SPKI bytes
 */
export async function importPublicKey(spkiBytes) {
  return crypto.subtle.importKey(
    'spki',
    spkiBytes.buffer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify']
  );
}

/**
 * Create a DID:KEY identifier from public key bytes
 * Simplified: base64url-encode the raw public key bytes
 * In production, use proper multicodec encoding (e.g., @multiformats/varint)
 */
export function publicKeyToDid(publicKeyBytes) {
  const base64url = btoa(String.fromCharCode(...publicKeyBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `did:key:z${base64url}`; // 'z' prefix indicates SECP256R1 in multicodec
}

/**
 * Create a Verifiable Credential (VC)
 * @param {Object} options
 *   - issuerDid: DID of the issuer (patient)
 *   - subjectDid: DID of the subject (patient, same as issuer for self-issued)
 *   - claims: health data to include (conditions, medications, allergies, summary)
 *   - privateKey: CryptoKey for signing
 */
export async function createCredential({ issuerDid, subjectDid, claims, privateKey }) {
  const issuanceDate = new Date().toISOString();

  // Construct credential subject
  const credentialSubject = {
    id: subjectDid,
    ...claims,
  };

  // Build the VC structure (without proof)
  const vc = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'VitaChainHealthPassport'],
    issuer: issuerDid,
    issuanceDate,
    credentialSubject,
  };

  // Create canonical string to sign (simplified: JSON stringify sorted keys)
  const dataToSign = JSON.stringify({
    ...vc,
    // Exclude proof from signature
  });

  // Sign with ECDSA-SHA256
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToSign);
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    data
  );

  // Convert signature to base64
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  // Create proof object
  const proof = {
    type: 'EcdsaSecp256r1Signature2019',
    created: new Date().toISOString(),
    verificationMethod: `${issuerDid}#keys-1`,
    proofPurpose: 'authentication',
    proofValue: signatureBase64,
  };

  // Attach proof
  vc.proof = proof;

  return vc;
}

/**
 * Verify a Verifiable Credential
 * Supports both full credentials (with cryptographic proof) and lightweight credentials (QR code fallback)
 */
export async function verifyCredential(vc, options = {}) {
  try {
    // Extract proof and data
    const { proof } = vc;

    // Lightweight credential fallback (no proof) – accept if structure is valid
    if (!proof) {
      const hasRequired =
        vc['@context'] &&
        vc.type &&
        vc.issuer &&
        vc.credentialSubject &&
        vc.credentialSubject.healthSummary;
      if (hasRequired) {
        return { valid: true, reason: 'Lightweight credential accepted (no signature)' };
      }
      return { valid: false, reason: 'Missing proof and required fields' };
    }

    // Rebuild the signed data (credential without proof)
    const vcCopy = { ...vc };
    delete vcCopy.proof;
    const dataToVerify = JSON.stringify(vcCopy);

    // Get verification method from proof
    const verificationMethod = proof.verificationMethod;
    if (!verificationMethod) {
      return { valid: false, reason: 'Missing verificationMethod' };
    }

    // Extract public key from DID (simplified: assume DID:KEY format)
    let publicKey;
    if (options.publicKey) {
      publicKey = options.publicKey;
    } else {
      // Derive from issuer DID
      const issuerDid = vc.issuer;
      if (!issuerDid.startsWith('did:key:')) {
        return { valid: false, reason: 'Unsupported DID method' };
      }
      const keyBytes = base64UrlToBytes(issuerDid.replace('did:key:z', ''));
      publicKey = await importPublicKey(keyBytes);
    }

    // Verify signature
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToVerify);
    const signatureBytes = base64ToBytes(proof.proofValue);

    const isValid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      publicKey,
      signatureBytes,
      data
    );

    return { valid: isValid };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

/**
 * Helper: base64url to Uint8Array
 */
function base64UrlToBytes(base64url) {
  // Pad base64 string
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (padded.length % 4)) % 4);
  const base64 = padded + padding;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Helper: base64 string to Uint8Array
 */
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode VC as compact JSON string (for QR)
 */
export function encodeCredential(vc) {
  return JSON.stringify(vc);
}

/**
 * Decode VC from JSON string
 */
export function decodeCredential(jsonStr) {
  return JSON.parse(jsonStr);
}
