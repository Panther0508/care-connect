// src/lib/encryption.ts
// Web Crypto API wrapper for AES-256-GCM encryption

export interface EncryptedPayload {
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
}

/**
 * Derive a cryptographic key from a passphrase using PBKDF2
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passphraseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext string with AES-256-GCM
 * Returns IV and ciphertext
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return { iv, ciphertext };
}

/**
 * Decrypt ciphertext with AES-256-GCM
 */
export async function decrypt(
  iv: Uint8Array,
  ciphertext: ArrayBuffer,
  key: CryptoKey
): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}
