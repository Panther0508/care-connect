// ═══════════════════════════════════════════════════════════════════════════════
// ENTRY POINT — CRITICAL INITIALIZATION ORDER
// ═══════════════════════════════════════════════════════════════════════════════
// 1. Initialize Automerge WASM (must complete before any Automerge usage)
// 2. Then load the rest of the application (dynamic import)
// ═══════════════════════════════════════════════════════════════════════════════

import { next as Automerge } from '@automerge/automerge/slim';
import wasmUrl from '@automerge/automerge/automerge.wasm?url';
import './index.css';

// Initialize WASM — this must complete before any Automerge API is used
await Automerge.initializeWasm(wasmUrl).catch((err) => {
  console.error('Failed to initialize Automerge WASM:', err);
});

// WASM ready — now load the application modules
await import('./i18n'); // i18n side-effects

// Import React and app code dynamically after WASM init
const { default: App } = await import('./App');
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StatusProvider } from './context/StatusContext';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { initFoodDatabase } from './services/foodDatabase';
import { initExerciseDatabase } from './services/exerciseDatabase';
import { ensureAllIndexed } from './services/advancedRAG';

function Root() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </StatusProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

try {
  createRoot(document.getElementById("root")!).render(<Root />);
} catch (error) {
  console.error("Failed to mount React app:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace; color: red; background: #0F172A;">
      <h1>Mount Error</h1>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
      <p>Check console for details.</p>
    </div>
  `;
}
