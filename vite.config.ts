import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// Simple API mock middleware for e2e tests
function apiMockMiddleware(): Plugin {
  return {
    name: 'api-mock',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          if (req.url.startsWith('/api/search')) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ results: [] }));
            return;
          }
          if (req.url.startsWith('/api/impact')) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ impact: {} }));
            return;
          }
          if (req.url.startsWith('/api/feedback') && req.method === 'POST') {
            res.statusCode = 200;
            res.end('OK');
            return;
          }
          if (req.url.startsWith('/api/satellite-ingest') && req.method === 'POST') {
            res.statusCode = 200;
            res.end('OK');
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), wasm(), topLevelAwait(), apiMockMiddleware()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx/runtime", "react/jsx/dev/runtime"],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('html5-qrcode')) return 'html5-qrcode';
        },
      },
    },
  },
  optimizeDeps: {
    include: ['html5-qrcode', 'tesseract.js'],
    exclude: ["@automerge/automerge"],
  },
}));
