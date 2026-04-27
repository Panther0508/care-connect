import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'device-credentials';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    const { available } = await NativeBiometric.isAvailable();
    return available;
  } catch (error) {
    console.error('Biometric availability check failed:', error);
    return false;
  }
}

/**
 * Get the type of biometric available
 */
export async function getBiometricType(): Promise<BiometricType | null> {
  try {
    const { biometricType } = await NativeBiometric.getInfo();
    return biometricType as BiometricType;
  } catch (error) {
    console.error('Failed to get biometric type:', error);
    return null;
  }
}

/**
 * Verify user via biometric authentication
 * @param reason Message to display in the biometric prompt
 */
export async function biometricVerify(reason: string = 'Authenticate to access VitaChain'): Promise<BiometricResult> {
  try {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, error: 'Not on native platform' };
    }

    const result = await NativeBiometric.verifyIdentity({
      reason,
      fallbackTitle: 'Use Passphrase',
      cancelTitle: 'Cancel',
    });

    return { success: result.verified };
  } catch (error: any) {
    console.error('Biometric verification failed:', error);
    return {
      success: false,
      error: error.message || 'Biometric verification failed',
    };
  }
}

/**
 * Check if user has configured device credentials (PIN/Pattern/Password)
 */
export async function isDeviceCredentialsAvailable(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    const { deviceCredentialsAvailable } = await NativeBiometric.isDeviceCredentialsAvailable();
    return deviceCredentialsAvailable;
  } catch (error) {
    console.error('Device credentials check failed:', error);
    return false;
  }
}
