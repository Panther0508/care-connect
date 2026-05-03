// src/lib/initAutomerge.ts
// Centralized Automerge v2 initialization — call exactly once at app startup
import * as automerge from '@automerge/automerge/slim';

let initialized = false;

export function initAutomerge() {
  if (initialized) return;
  try {
    // @ts-ignore — automerge.use() may not be in slim typings but exists at runtime
    automerge.use();
    initialized = true;
    console.log('✅ Automerge initialized');
  } catch (e) {
    // Ignore if already initialized (throws "already called")
    if (!e.message?.includes('already')) {
      console.warn('Automerge init failed:', e);
    } else {
      initialized = true;
    }
  }
}
