import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { VitePWA } from "vite-plugin-pwa";

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
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.jpg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'VitaChain — Your Health, Your Guardian',
        short_name: 'VitaChain',
        description: 'Offline‑first, self‑sovereign AI health guardian for the Global South.',
        theme_color: '#0F172A',
        background_color: '#0F172A',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
    apiMockMiddleware(),
  ],
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
