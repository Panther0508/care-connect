import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StatusProvider } from "./context/StatusContext";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("VITE_CLERK_PUBLISHABLE_KEY is not set. Clerk auth will be disabled.");
}

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/serviceWorker.js").catch((err) =>
    console.log("ServiceWorker registration failed:", err)
  );
}

const clerkProviderProps = PUBLISHABLE_KEY
  ? { publishableKey: PUBLISHABLE_KEY }
  : {};

export default function Root() {
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
