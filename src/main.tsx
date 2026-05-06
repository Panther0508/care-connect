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
import { ClerkProvider } from '@clerk/clerk-react';
import { initFoodDatabase } from './services/foodDatabase';
import { initExerciseDatabase } from './services/exerciseDatabase';
import { ensureAllIndexed } from './services/advancedRAG';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("VITE_CLERK_PUBLISHABLE_KEY is not set. Clerk auth will be disabled.");
}

// URGENT: Force-unregister any existing service workers to break stale cache loop
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

// Service Worker registration for offline AI model caching
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/serviceWorker.js", { updateViaCache: 'none' })
    .then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        }
      });
    })
    .catch((err) => console.log("ServiceWorker registration failed:", err));
}

// Initialize offline databases
initFoodDatabase().catch(err => console.error('Failed to init food DB:', err));
initExerciseDatabase().catch(err => console.error('Failed to init exercise DB:', err));

// Index RAG datasets on first startup (non-blocking)
ensureAllIndexed().catch(err => console.error('RAG indexing failed:', err));

// Migrate any existing localStorage user data to IndexedDB (non-blocking)
import('./lib/dataMigration').then(({ runMigration }) => {
  runMigration().catch(err => console.error('Data migration failed:', err));
}).catch(err => console.error('Failed to load migration module:', err));

const clerkProviderProps = PUBLISHABLE_KEY
  ? { publishableKey: PUBLISHABLE_KEY, rethrowOfflineNetworkErrors: true }
  : { publishableKey: "pk_test_placeholder", rethrowOfflineNetworkErrors: true };

function Root() {
  return (
    <ErrorBoundary>
      <ClerkProvider {...clerkProviderProps}>
        <StatusProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </StatusProvider>
      </ClerkProvider>
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
