// src/lib/initAutomerge.ts
// Centralized Automerge v2 initialization — MUST be executed before any Automerge usage
import * as automerge from '@automerge/automerge/slim';
import wasmUrl from '@automerge/automerge/automerge.wasm?url';

// Initialize WASM before any document operations
let initialized = false;
export async function initAutomerge() {
  if (initialized) return;
  try {
    await automerge.initializeWasm(wasmUrl);
    initialized = true;
  } catch (e) {
    // Ignore "already initialized" errors
    if (!String(e).includes('already')) {
      console.warn('Automerge init failed:', e);
    }
  }
}

// Auto-initialize when module loads
initAutomerge().catch(() => {});
