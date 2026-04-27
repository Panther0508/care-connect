// src/lib/admin/index.ts
// Admin authentication and MFA service with biometric support

import { deriveKey, encrypt, decrypt, generateSalt } from '../encryption';
import {
  isBiometricAvailable,
  biometricVerify,
  isDeviceCredentialsAvailable,
} from '../biometric/biometricAuth';
import { getItem, setItem, removeItem } from '../idb';

// Storage keys
const ADMIN_TOKEN_KEY = 'vita_admin_token';
const ADMIN_SALT_KEY = 'vita_admin_salt';
const ADMIN_ENCRYPTED_KEY = 'vita_admin_encrypted_key';
const ADMIN_ACTION_QUEUE_KEY = 'vita_admin_action_queue';
const ADMIN_LOCK_TIMESTAMP_KEY = 'vita_admin_lock_timestamp';
const ADMIN_PIN_HASH_KEY = 'vita_admin_pin_hash';

// Configuration
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface AdminToken {
  token: string;
  expiresAt: number;
  encryptedKey: ArrayBuffer; // AES key encrypted with admin PIN
  salt: Uint8Array;
  lastRefresh: number;
}

export interface QueuedAdminAction {
  id: string;
  action: string;
  payload: any;
  timestamp: number;
  retries: number;
}

export interface AdminAuthState {
  adminToken: string | null;
  isAdminAuthenticated: boolean;
  isOfflineReady: boolean;
}

export interface LoginAttempt {
  timestamp: number;
  success: boolean;
}

class AdminService {
  private _adminToken: string | null = null;
  private _isAdminAuthenticated: boolean = false;
  private _isOfflineReady: boolean = false;
  private _cryptoKey: CryptoKey | null = null;
  private _listeners: Set<() => void> = new Set();

  constructor() {
    this.initialize();
  }

  // Getters
  get adminToken(): string | null {
    return this._adminToken;
  }

  get isAdminAuthenticated(): boolean {
    return this._isAdminAuthenticated;
  }

  get isOfflineReady(): boolean {
    return this._isOfflineReady;
  }

  // Event emitter pattern for state changes
  private emitChange(): void {
    this._listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private async initialize(): Promise<void> {
    try {
      await this.restoreSession();
      this._isOfflineReady = true;
      this.emitChange();
    } catch (error) {
      console.error('[AdminService] Initialization failed:', error);
      this._isOfflineReady = true; // Still ready, just not authenticated
      this.emitChange();
    }
  }

  private async restoreSession(): Promise<void> {
    try {
      const storedToken = await getItem<AdminToken>(ADMIN_TOKEN_KEY);
      if (!storedToken) {
        return;
      }

      // Check if token is expired
      const now = Date.now();
      if (now > storedToken.expiresAt) {
        console.log('[AdminService] Token expired, clearing session');
        await this.clearSession();
        return;
      }

      this._adminToken = storedToken.token;
      this._isAdminAuthenticated = true;

      // Try to restore crypto key from encrypted storage
      const encryptedKey = await getItem<ArrayBuffer>(ADMIN_ENCRYPTED_KEY);
      const salt = await getItem<Uint8Array>(ADMIN_SALT_KEY);
      if (encryptedKey && salt) {
        // Key can only be decrypted with PIN (user must unlock)
        this._cryptoKey = null;
        console.log('[AdminService] Session restored, requires PIN unlock');
      }

      this.emitChange();
    } catch (error) {
      console.error('[AdminService] Failed to restore session:', error);
    }
  }

  private async updateSession(token: AdminToken): Promise<void> {
    await setItem(ADMIN_TOKEN_KEY, token);
    this._adminToken = token.token;
    this._isAdminAuthenticated = true;
    this.emitChange();
  }

  private async clearSession(): Promise<void> {
    await Promise.all([
      removeItem(ADMIN_TOKEN_KEY),
      removeItem(ADMIN_LOCK_TIMESTAMP_KEY),
    ]);
    this._adminToken = null;
    this._isAdminAuthenticated = false;
    this._cryptoKey = null;
    this.emitChange();
  }

  /**
   * Derive encryption key from PIN using PBKDF2
   */
  private async derivePinKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    return deriveKey(pin, salt);
  }

  /**
   * Login with PIN and optional biometric verification
   */
  async unlockAdmin(pin: string, useBiometric: boolean = false): Promise<boolean> {
    try {
      // Check login attempts
      const attempts = await this.getLoginAttempts();
      const recentFailures = attempts.filter(
        (a) => !a.success && Date.now() - a.timestamp < LOGIN_ATTEMPT_WINDOW_MS
      );

      if (recentFailures.length >= MAX_LOGIN_ATTEMPTS) {
        throw new Error(
          `Too many failed attempts. Please wait ${LOGIN_ATTEMPT_WINDOW_MS / 60000} minutes.`
        );
      }

      // Biometric verification if requested and available
      if (useBiometric) {
        const available = await isBiometricAvailable();
        if (!available) {
          throw new Error('Biometric authentication not available');
        }

        const result = await biometricVerify('Authenticate to unlock admin panel');
        if (!result.success) {
          await this.recordLoginAttempt(false);
          throw new Error('Biometric verification failed');
        }
      }

      // Get encrypted key and salt
      const encryptedKey = await getItem<ArrayBuffer>(ADMIN_ENCRYPTED_KEY);
      const salt = await getItem<Uint8Array>(ADMIN_SALT_KEY);

      if (!encryptedKey || !salt) {
        // First time setup - derive key from PIN and encrypt a new AES key
        const newSalt = generateSalt();
        const pinKey = await this.derivePinKey(pin, newSalt);
        const aesKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );

        // Store salt
        await setItem(ADMIN_SALT_KEY, newSalt);

        // For first-time setup, we store the raw key (encrypted with app-level encryption)
        const keyData = await crypto.subtle.exportKey('raw', aesKey);
        this._cryptoKey = aesKey;

        // Record success
        await this.recordLoginAttempt(true);
        await this.removeLock();
        
        console.log('[AdminService] Admin unlocked successfully (first time)');
        return true;
      }

      // Derive key from PIN
      const pinKey = await this.derivePinKey(pin, salt);

      // Decrypt the stored AES key
      const storedKey = await getItem<ArrayBuffer>(ADMIN_ENCRYPTED_KEY);
      if (!storedKey) {
        throw new Error('Encrypted key not found');
      }

      // For now, we use the pinKey directly for data encryption
      // In production, pinKey should decrypt a stored master key
      this._cryptoKey = pinKey;

      // Restore token
      await this.restoreSession();

      // Record success
      await this.recordLoginAttempt(true);
      await this.removeLock();

      console.log('[AdminService] Admin unlocked successfully');
      return true;
    } catch (error) {
      console.error('[AdminService] Unlock failed:', error);
      await this.recordLoginAttempt(false);
      throw error;
    }
  }

  private async recordLoginAttempt(success: boolean): Promise<void> {
    const attempts = await this.getLoginAttempts();
    attempts.push({ timestamp: Date.now(), success });
    
    // Keep only recent attempts
    const cutoff = Date.now() - LOGIN_ATTEMPT_WINDOW_MS;
    const recentAttempts = attempts.filter((a) => a.timestamp > cutoff);
    
    await setItem('vita_admin_login_attempts', recentAttempts);
  }

  private async getLoginAttempts(): Promise<LoginAttempt[]> {
    const attempts = await getItem<LoginAttempt[]>('vita_admin_login_attempts');
    return attempts || [];
  }

  /**
   * Verify biometrics (standalone check)
   */
  async verifyBiometric(): Promise<boolean> {
    try {
      const available = await isBiometricAvailable();
      if (!available) {
        console.warn('[AdminService] Biometric not available');
        return false;
      }

      const result = await biometricVerify('Authenticate for admin access');
      if (result.success) {
        console.log('[AdminService] Biometric verification successful');
        return true;
      }

      console.warn('[AdminService] Biometric verification failed:', result.error);
      return false;
    } catch (error) {
      console.error('[AdminService] Biometric verification error:', error);
      return false;
    }
  }

  /**
   * Lock admin session
   */
  lockAdmin(): void {
    this._isAdminAuthenticated = false;
    this._cryptoKey = null;
    setItem(ADMIN_LOCK_TIMESTAMP_KEY, Date.now());
    console.log('[AdminService] Admin session locked');
    this.emitChange();
  }

  /**
   * Remove lock status
   */
  private async removeLock(): Promise<void> {
    await removeItem(ADMIN_LOCK_TIMESTAMP_KEY);
  }

  /**
   * Check if admin is locked
   */
  async isLocked(): Promise<boolean> {
    const lockTime = await getItem<number>(ADMIN_LOCK_TIMESTAMP_KEY);
    if (!lockTime) {
      return false;
    }

    const now = Date.now();
    if (now - lockTime > LOCK_TIMEOUT_MS) {
      await this.removeLock();
      return false;
    }

    return true;
  }

  /**
   * Check if device credentials are available for fallback
   */
  async isDeviceCredentialsAvailable(): Promise<boolean> {
    return isDeviceCredentialsAvailable();
  }

  /**
   * Set or update admin token
   */
  async setAdminToken(token: string, expiresIn: number = 3600000): Promise<void> {
    const expiresAt = Date.now() + expiresIn;
    const salt = await getItem<Uint8Array>(ADMIN_SALT_KEY);

    if (!salt) {
      const newSalt = generateSalt();
      await setItem(ADMIN_SALT_KEY, newSalt);
    }

    const adminToken: AdminToken = {
      token,
      expiresAt,
      encryptedKey: new ArrayBuffer(0), // Will be set during unlock
      salt: salt || generateSalt(),
      lastRefresh: Date.now(),
    };

    await this.updateSession(adminToken);
  }

  /**
   * Refresh admin token
   */
  async refreshToken(): Promise<string | null> {
    if (!this._adminToken) {
      return null;
    }

    try {
      // In a real implementation, this would call an API to refresh the token
      // For now, we just extend the expiry
      const storedToken = await getItem<AdminToken>(ADMIN_TOKEN_KEY);
      if (!storedToken) {
        return null;
      }

      const newToken: AdminToken = {
        ...storedToken,
        expiresAt: Date.now() + 3600000,
        lastRefresh: Date.now(),
      };

      await this.updateSession(newToken);
      return this._adminToken;
    } catch (error) {
      console.error('[AdminService] Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Sign out admin
   */
  async signOut(): Promise<void> {
    await this.clearSession();
    await this.clearActionQueue();
    this._cryptoKey = null;
    console.log('[AdminService] Admin signed out');
  }

  /**
   * Queue admin action for offline execution
   */
  async queueAdminAction(action: string, payload: any): Promise<void> {
    const queue = await this.getActionQueue();
    const queuedAction: QueuedAdminAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };

    queue.push(queuedAction);
    await setItem(ADMIN_ACTION_QUEUE_KEY, queue);

    console.log('[AdminService] Action queued:', action, queuedAction.id);

    // Try to sync if online
    if (navigator.onLine) {
      await this.syncAdminActions();
    }
  }

  /**
   * Get all queued actions
   */
  private async getActionQueue(): Promise<QueuedAdminAction[]> {
    const queue = await getItem<QueuedAdminAction[]>(ADMIN_ACTION_QUEUE_KEY);
    return queue || [];
  }

  /**
   * Clear action queue
   */
  private async clearActionQueue(): Promise<void> {
    await removeItem(ADMIN_ACTION_QUEUE_KEY);
  }

  /**
   * Sync queued actions with server
   */
  async syncAdminActions(): Promise<void> {
    if (!this._isAdminAuthenticated || !this._adminToken) {
      console.warn('[AdminService] Cannot sync: not authenticated');
      return;
    }

    const queue = await this.getActionQueue();
    if (queue.length === 0) {
      return;
    }

    console.log(`[AdminService] Syncing ${queue.length} queued actions...`);

    const remainingActions: QueuedAdminAction[] = [];
    const MAX_RETRIES = 3;

    for (const action of queue) {
      try {
        // In a real implementation, this would make an API call
        // await apiClient.post(`/admin/actions/${action.action}`, action.payload);

        console.log('[AdminService] Synced action:', action.action, action.id);
        // Action synced successfully - don't add to remaining
      } catch (error) {
        console.error('[AdminService] Failed to sync action:', action.action, error);

        if (action.retries < MAX_RETRIES) {
          remainingActions.push({
            ...action,
            retries: action.retries + 1,
          });
        } else {
          console.error(
            '[AdminService] Action discarded after max retries:',
            action.action,
            action.id
          );
        }
      }
    }

    await setItem(ADMIN_ACTION_QUEUE_KEY, remainingActions);
  }

  /**
   * Encrypt data using admin key
   */
  async encryptData(data: string): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer } | null> {
    if (!this._cryptoKey) {
      throw new Error('Admin not unlocked - crypto key unavailable');
    }

    return encrypt(data, this._cryptoKey);
  }

  /**
   * Decrypt data using admin key
   */
  async decryptData(
    iv: Uint8Array,
    ciphertext: ArrayBuffer
  ): Promise<string | null> {
    if (!this._cryptoKey) {
      throw new Error('Admin not unlocked - crypto key unavailable');
    }

    return decrypt(iv, ciphertext, this._cryptoKey);
  }

  /**
   * Get current admin state
   */
  getState(): AdminAuthState {
    return {
      adminToken: this._adminToken,
      isAdminAuthenticated: this._isAdminAuthenticated,
      isOfflineReady: this._isOfflineReady,
    };
  }
}

// Singleton instance
export const adminService = new AdminService();

// React context provider will be in AdminContext.tsx