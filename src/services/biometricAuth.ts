import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'device-credentials' | 'web-authn';

export interface BiometricResult {
  success: boolean;
  error?: string;
  type?: BiometricType;
}

const CREDENTIALS_STORAGE_KEY = 'biometric_credentials';

/**
 * Check if any biometric authentication is available (native or WebAuthn)
 */
export async function isBiometricAvailable(): Promise<boolean> {
  // Native platform (iOS/Android) — use Capacitor plugin
  if (Capacitor.isNativePlatform()) {
    try {
      const { available } = await NativeBiometric.isAvailable();
      return available;
    } catch {
      return false;
    }
  }

  // Web platform — check WebAuthn support
  if (typeof navigator !== 'undefined' && 'credentials' in navigator) {
    try {
      // PublicKeyCredential is promised-based; check existence only
      return typeof PublicKeyCredential !== 'undefined';
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Get the type of biometric available
 */
export async function getBiometricType(): Promise<BiometricType | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { biometricType } = await NativeBiometric.getInfo();
      return biometricType as BiometricType;
    } catch {
      return null;
    }
  }

  // Web: assume face or fingerprint depending on platform
  if (typeof PublicKeyCredential !== 'undefined') {
    // navigator.credentials.get supports both; no way to distinguish
    // Default to 'face' on Apple silicon, 'fingerprint' elsewhere
    const isApple = /Macintosh|iPhone|iPad/i.test(navigator.userAgent);
    return isApple ? 'face' : 'fingerprint';
  }

  return null;
}

/**
 * Verify user via biometric authentication
 * @param reason Message to display in the prompt
 */
export async function biometricVerify(reason: string = 'Authenticate to access VitaChain'): Promise<BiometricResult> {
  // Native path
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await NativeBiometric.verifyIdentity({
        reason,
        fallbackTitle: 'Use Passphrase',
        cancelTitle: 'Cancel',
      });
      return { success: result.verified, type: 'device-credentials' };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Biometric verification failed',
        type: 'device-credentials',
      };
    }
  }

  // WebAuthn path
  if (typeof navigator !== 'undefined' && 'credentials' in navigator && typeof PublicKeyCredential !== 'undefined') {
    try {
      // Check if we have a stored credential ID for this user
      const stored = await getStoredCredentials();
      const allowCredentials = stored?.credentialId ? [{ id: base64ToArrayBuffer(stored.credentialId), type: 'public-key' }] : undefined;

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
        },
      });

      if (assertion) {
        // Verify the assertion on server would go here; for offline demo, accept locally
        // In production, you'd send assertion to backend for verification
        return { success: true, type: 'web-authn' };
      }

      return { success: false, error: 'No assertion received', type: 'web-authn' };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'WebAuthn verification failed',
        type: 'web-authn',
      };
    }
  }

  return { success: false, error: 'Biometric authentication not supported on this platform' };
}

/**
 * Register a new WebAuthn credential (browser only; native platforms handle registration separately)
 * @param userId - User identifier (email or user ID)
 */
export async function registerBiometric(userId: string): Promise<BiometricResult> {
  if (Capacitor.isNativePlatform()) {
    // Native platforms handle registration through system UI; store that it's enabled
    await saveBiometricEnabled(userId, true);
    return { success: true, type: 'device-credentials' };
  }

  if (typeof navigator !== 'undefined' && 'credentials' in navigator && typeof PublicKeyCredential !== 'undefined') {
    try {
      const keyPair = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            name: 'VitaChain',
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userId,
            displayName: userId,
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256
          timeout: 60000,
          attestation: 'direct',
        },
      });

      if (keyPair) {
        const credentialId = Array.from((keyPair as any).rawId).map(b => String.fromCharCode(b)).join('');
        await storeCredentials(userId, {
          credentialId: arrayBufferToBase64((keyPair as any).rawId),
          publicKey: (keyPair as any).getPublicKey(),
        });
        return { success: true, type: 'web-authn' };
      }

      return { success: false, error: 'Failed to create credentials' };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'WebAuthn registration failed',
        type: 'web-authn',
      };
    }
  }

  return { success: false, error: 'WebAuthn not supported' };
}

/**
 * Check if user has registered biometrics
 */
export async function isBiometricRegistered(userId: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    // Native: check IndexedDB/localStorage for flag
    const stored = await getBiometricFlag(userId);
    return stored === true;
  }

  // Web: check if credential exists in IndexedDB
  const creds = await getStoredCredentials();
  return creds !== null && creds.userId === userId;
}

/**
 * Disable biometrics for a user (clear stored credentials)
 */
export async function disableBiometric(userId: string): Promise<void> {
  await clearStoredCredentials(userId);
  await removeBiometricFlag(userId);
}

// ==================== IndexedDB Storage ====================

interface StoredCredentials {
  userId: string;
  credentialId: string;
  createdAt: number;
}

async function storeCredentials(userId: string, data: { credentialId: string; publicKey?: any }): Promise<void> {
  const item: StoredCredentials = {
    userId,
    credentialId: data.credentialId,
    createdAt: Date.now(),
  };
  const key = `${CREDENTIALS_STORAGE_KEY}:${userId}`;
  await localStorage.setItem(key, JSON.stringify(item));
}

async function getStoredCredentials(): Promise<StoredCredentials | null> {
  // For demo, we store for any userId; retrieve first matching entry
  const keys = Object.keys(localStorage).filter(k => k.startsWith(`${CREDENTIALS_STORAGE_KEY}:`));
  if (keys.length === 0) return null;
  const raw = localStorage.getItem(keys[0]);
  return raw ? JSON.parse(raw) : null;
}

async function clearStoredCredentials(userId: string): Promise<void> {
  const key = `${CREDENTIALS_STORAGE_KEY}:${userId}`;
  localStorage.removeItem(key);
}

async function saveBiometricEnabled(userId: string, enabled: boolean): Promise<void> {
  const key = `biometric_enabled:${userId}`;
  await localStorage.setItem(key, enabled ? 'true' : 'false');
}

async function getBiometricFlag(userId: string): Promise<boolean> {
  const key = `biometric_enabled:${userId}`;
  return localStorage.getItem(key) === 'true';
}

async function removeBiometricFlag(userId: string): Promise<void> {
  const key = `biometric_enabled:${userId}`;
  localStorage.removeItem(key);
}

// ==================== Utilities ====================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
