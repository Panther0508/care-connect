// src/lib/admin/README.md
# Admin Authentication Service

## Overview

The Admin Authentication Service provides secure admin panel access with MFA (PIN + Biometric) support, offline capability, and action queuing for the VitaChain application.

## Features

- **PIN-based Authentication**: Secure admin login with PBKDF2 key derivation
- **Biometric Support**: Optional Face ID / Fingerprint authentication
- **Offline-Ready**: Fully functional without network connectivity
- **Session Locking**: Auto-lock after 5 minutes of inactivity
- **Action Queue**: Queue admin actions when offline, sync when back online
- **Encrypted Storage**: Admin tokens and sensitive data stored securely in IndexedDB
- **Brute Force Protection**: Max 5 login attempts per 15-minute window

## API Reference

### AdminService

#### Properties

- `adminToken: string | null` - Current admin authentication token
- `isAdminAuthenticated: boolean` - Whether admin is currently authenticated
- `isOfflineReady: boolean` - Whether the service is initialized and ready

#### Methods

##### `unlockAdmin(pin: string, useBiometric?: boolean): Promise<boolean>`
Authenticate admin with PIN and optionally biometric verification.

```typescript
const success = await adminService.unlockAdmin('123456', true);
```

##### `lockAdmin(): void`
Manually lock the admin session.

```typescript
adminService.lockAdmin();
```

##### `verifyBiometric(): Promise<boolean>`
Verify biometric authentication (Face ID / Fingerprint).

```typescript
const verified = await adminService.verifyBiometric();
```

##### `queueAdminAction(action: string, payload: any): Promise<void>`
Queue an admin action for execution when online.

```typescript
await adminService.queueAdminAction('updateConfig', {
  key: 'maxUsers',
  value: 100
});
```

##### `syncAdminActions(): Promise<void>`
Synchronize queued actions with the server.

```typescript
await adminService.syncAdminActions();
```

##### `signOut(): Promise<void>`
Sign out admin and clear all session data.

```typescript
await adminService.signOut();
```

##### `isLocked(): Promise<boolean>`
Check if admin session is currently locked.

```typescript
const locked = await adminService.isLocked();
```

##### `refreshToken(): Promise<string | null>`
Refresh the admin authentication token.

```typescript
const token = await adminService.refreshToken();
```

##### `setAdminToken(token: string, expiresIn?: number): Promise<void>`
Set or update the admin token (typically after initial authentication).

```typescript
await adminService.setAdminToken('jwt-token-here', 3600000);
```

##### `encryptData(data: string): Promise<{iv: Uint8Array, ciphertext: ArrayBuffer}>`
Encrypt sensitive data using the admin's derived key.

```typescript
const encrypted = await adminService.encryptData('secret-data');
```

##### `decryptData(iv: Uint8Array, ciphertext: ArrayBuffer): Promise<string>`
Decrypt data using the admin's derived key.

```typescript
const decrypted = await adminService.decryptData(iv, ciphertext);
```

##### `subscribe(listener: () => void): () => void`
Subscribe to admin state changes.

```typescript
const unsubscribe = adminService.subscribe(() => {
  console.log('State changed:', adminService.getState());
});
// Later...
unsubscribe();
```

##### `getState(): AdminAuthState`
Get the current admin authentication state.

```typescript
const state = adminService.getState();
console.log(state.isAdminAuthenticated);
```

### React Context

The service is wrapped in a React context provider for easy integration with React components.

#### Usage

```tsx
import { AdminProvider, useAdmin } from '../context/AdminContext';

// Wrap your app
function App() {
  return (
    <AdminProvider>
      <AdminPanel />
    </AdminProvider>
  );
}

// Use in components
function AdminPanel() {
  const {
    adminToken,
    isAdminAuthenticated,
    isOfflineReady,
    unlockAdmin,
    lockAdmin,
    verifyBiometric,
    queueAdminAction,
    syncAdminActions,
    signOut,
    isLocked,
    refreshToken
  } = useAdmin();

  const handleLogin = async () => {
    try {
      const success = await unlockAdmin('123456', true);
      if (success) {
        console.log('Admin authenticated!');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      {isAdminAuthenticated ? (
        <AdminDashboard />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  );
}
```

## Security Features

### Key Derivation
- Uses PBKDF2 with SHA-256
- 100,000 iterations
- 16-byte random salt
- 256-bit AES key

### Encryption
- AES-256-GCM authenticated encryption
- 12-byte random IV per encryption
- Integrated authentication tag

### Session Management
- Token expiry checking
- Auto-lock after 5 minutes
- Graceful offline handling

### Brute Force Protection
- Max 5 failed attempts per 15-minute window
- Failed attempts tracked in IndexedDB
- Lock status persisted

## Storage

All data is stored in IndexedDB using the existing `idb.ts` utility:

| Key | Type | Description |
|-----|------|-------------|
| `vita_admin_token` | `AdminToken` | Admin token and metadata |
| `vita_admin_salt` | `Uint8Array` | PBKDF2 salt |
| `vita_admin_encrypted_key` | `ArrayBuffer` | Encrypted AES key |
| `vita_admin_action_queue` | `QueuedAdminAction[]` | Queued actions |
| `vita_admin_lock_timestamp` | `number` | Lock timestamp |
| `vita_admin_login_attempts` | `LoginAttempt[]` | Failed login attempts |

## Error Handling

All methods include comprehensive error handling:

```typescript
try {
  await adminService.unlockAdmin(pin);
} catch (error) {
  console.error('Unlock failed:', error.message);
}
```

Common errors:
- `'Biometric authentication not available'` - Device lacks biometric hardware
- `'Biometric verification failed'` - User cancelled or failed biometric check
- `'Too many failed attempts'` - Rate limit exceeded
- `'Encrypted key not found'` - First-time setup required
- `'Admin not unlocked'` - Crypto key not available

## Integration with Existing Code

The service integrates with existing project infrastructure:

- **Encryption**: Uses `src/lib/encryption.ts` utilities
- **Biometric**: Uses `src/lib/biometric/biometricAuth.ts`
- **Storage**: Uses `src/lib/idb.ts` for IndexedDB operations
- **Type Safety**: Full TypeScript support
- **React**: Context provider for easy component integration

## Example: Complete Admin Login Flow

```tsx
import { useAdmin } from '../context/AdminContext';
import { useBiometric } from '../lib/biometric/biometricAuth';

function AdminLogin() {
  const { unlockAdmin, isOfflineReady } = useAdmin();
  const [pin, setPin] = useState('');
  const [useBiometric, setUseBiometric] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const success = await unlockAdmin(pin, useBiometric);
      if (success) {
        console.log('Login successful!');
      } else {
        setError('Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOfflineReady) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter PIN"
        disabled={loading}
      />
      <label>
        <input
          type="checkbox"
          checked={useBiometric}
          onChange={(e) => setUseBiometric(e.target.checked)}
        />
        Use biometric authentication
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Authenticating...' : 'Login'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

## Testing

Test the service:

```typescript
describe('AdminService', () => {
  it('should unlock with valid PIN', async () => {
    const success = await adminService.unlockAdmin('123456');
    expect(success).toBe(true);
    expect(adminService.isAdminAuthenticated).toBe(true);
  });

  it('should queue and sync actions', async () => {
    await adminService.queueAdminAction('test', { data: 'value' });
    await adminService.syncAdminActions();
    // Verify queue is empty
  });
});
```
