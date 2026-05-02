// src/services/hybridAIRouter.js
// BACKWARD-COMPATIBILITY SHIM — re-exports from aiCoreRouter
// This prevents breaking imports in existing components (AIAssistant, etc.)
// DEPRECATED: New code should import from aiCoreRouter directly

export {
  routeQuery,
  getQuotaRemaining,
  embedText,
  loadTinyLlama,
  loadEmbedder,
  getLastRouteResult,
  getLastReasoning
} from './aiCoreRouter.js';

// Re-export legacy names
export { getLastRouteResult } from './aiCoreRouter.js'; // Not implemented in router (no single global state) — returning null

// Note: Individual AI services (medicalAI, clinicianAI, chwAI) now import from aiCoreRouter
// This file remains only for legacy references; remove after migration complete.
