import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StatusProvider } from "./context/StatusContext";
import { createRoot } from "react-dom/client";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("VITE_CLERK_PUBLISHABLE_KEY is not set. Clerk auth will be disabled.");
}

// Register service worker with immediate update
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/serviceWorker.js", { updateViaCache: 'none' })
    .then((registration) => {
      // Force update if a new service worker is available
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              // Reload to use new service worker
              window.location.reload();
            }
          });
        }
      });
    })
    .catch((err) => console.log("ServiceWorker registration failed:", err));
}

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
