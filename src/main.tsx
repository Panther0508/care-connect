// ═══════════════════════════════════════════════════════════════════════════════
// ENTRY POINT — CRITICAL INITIALIZATION ORDER
// ═══════════════════════════════════════════════════════════════════════════════
// MUST execute in this exact order before ANY other code:
// 1. Call automerge.use() synchronously (Automerge v2 requirement)
// 2. Configure HuggingFace env
// 3. Then import React and other modules
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1: Initialize Automerge FIRST — before any module that uses Automerge
// This must be a direct synchronous call at module top-level
import * as automerge from '@automerge/automerge/slim';
try {
  // @ts-ignore — use() is required for v2 proxy-based change tracking
  automerge.use();
  console.log('✅ Automerge initialized (main.tsx synchronous)');
} catch (e) {
  // Ignore "already called" — means initialized elsewhere (shouldn't happen)
  if (!e.message?.includes('already')) {
    console.error('❌ Automerge init failed:', e);
  }
}

// Step 2: Configure HuggingFace Transformers BEFORE any transformers code runs
import { env } from '@huggingface/transformers';
env.allowLocalModels = false;
env.useBrowserCache = true;

// Step 3: Standard React imports
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StatusProvider } from "./context/StatusContext";
import { createRoot } from "react-dom/client";
import { initFoodDatabase } from "./services/foodDatabase";
import { initExerciseDatabase } from "./services/exerciseDatabase";
import { ensureAllIndexed } from "./services/advancedRAG";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("VITE_CLERK_PUBLISHABLE_KEY is not set. Clerk auth will be disabled.");
}

// URGENT: Force-unregister any existing service workers to break stale cache loop
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log("Unregistered stale service worker:", registration.scope);
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
      console.log('ServiceWorker registered:', registration);
    })
    .catch((err) => console.log("ServiceWorker registration failed:", err));
}

// Initialize offline databases
initFoodDatabase().catch(err => console.error('Failed to init food DB:', err));
initExerciseDatabase().catch(err => console.error('Failed to init exercise DB:', err));

// Index RAG datasets on first startup (non-blocking)
ensureAllIndexed().catch(err => console.error('RAG indexing failed:', err));

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
