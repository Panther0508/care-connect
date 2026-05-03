// src/lib/initAutomerge.ts
// Centralized Automerge v2 initialization — MUST be executed before any Automerge usage
import * as automerge from '@automerge/automerge/slim';

// Call use() immediately upon module evaluation (synchronously)
try {
  // @ts-ignore — automerge.use may not be in typings but exists at runtime
  automerge.use();
  console.log('✅ Automerge initialized');
} catch (e) {
  // Ignore "already called" errors — that means it was initialized elsewhere
  if (!e.message?.includes('already')) {
    console.warn('Automerge init failed:', e);
  }
}
