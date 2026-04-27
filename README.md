# VitaChain — Offline-First Self-Sovereign Health Guardian

**VitaChain** is a privacy-preserving, offline-capable health AI that lives entirely on your phone. It provides a personal health graph, on-device medical AI, and peer-to-peer mesh intelligence to help patients and communities track and respond to health needs — all without relying on cloud connectivity.

## Status

### Built (Phases 2 & 3)
- **Personal Health Graph** — Encrypted CRDT-based health records (conditions, medications, allergies, encounters) stored locally with AES-256-GCM encryption.
- **On-Device Medical AI** — Gemma 2B language model running in-browser via Transformers.js for clinical summarization, pre-visit summaries, and medication interaction checking.
- **Mesh Intelligence** — Peer-to-peer gossip protocol over BroadcastChannel/Bluetooth for anonymized epidemiological signals (search counters, facility confirmations, stockout alerts) with CRDT convergence.

### Remaining (Phases 4 & 5)
- **Universal Health Passport** — W3C Verifiable Credentials as QR codes for offline sharing with clinicians.
- **Capacitor Wrapper** — Native Android APK generation with Bluetooth LE, push notifications, and background services.

## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS, React Router
- Offline AI: Transformers.js + ONNX Runtime Web
- CRDT: Automerge v2 (slim build, pure JS)
- Local Storage: IndexedDB with Web Crypto API (AES-256-GCM)
- Mesh: BroadcastChannel (local tab sync) + Web Bluetooth (cross-device)
- Maps: Leaflet.js (offline-capable)
- Deployment: Vercel (static hosting + serverless functions)

## Features

### 1. Personal Health Graph (`/health`)
- Add and manage conditions, medications, allergies, encounters
- All records encrypted and stored locally
- CRDT architecture supports future synchronization

### 2. AI Assistant (`/ai`)
- Loads Gemma 2B (quantized) entirely on-device
- Generate clinical summaries from health history
- Pre-visit summaries tailored to specialty (e.g., cardiology)
- Medication interaction checker (LLM + rule-based fallback)
- Works fully offline after model download

### 3. Mesh Intelligence (`/outbreak`)
- Anonymized search term counters broadcast peer-to-peer
- Facility confirmation flags (when a reservation is completed)
- Stockout reporting
- Outbreak dashboard with anomaly detection and heatmap
- Privacy by design — no personal identifiers ever leave the device

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd care-connect
npm install
npm run dev
```

Open http://localhost:8080

### Build for Production

```bash
npm run build
npm run preview
```

### Environment Variables

Create a `.env.local` file (not committed) with:

```env
VITE_API_URL=https://your-vercel-app.vercel.app
GEMINI_API_KEY=your_gemini_key  # for online search fallback
KV_REST_API_URL=your_upstash_redis_url # optional, for cloud sync (future)
KV_REST_API_TOKEN=your_upstash_token
```

### Data

Offline facility data (`public/facilities_offline.json`) is loaded on first run and stored in IndexedDB. This dataset currently includes facilities for India (10k records) and can be extended.

## Project Structure

```
care-connect/
├── src/
│   ├── lib/           # Core libraries (encryption, CRDT, IndexedDB helpers, gossip protocol)
│   ├── services/      # Business logic (healthGraph, medicalAI, meshOrchestrator, bluetoothTransport)
│   ├── pages/         # React pages (Home, Health, AI, Outbreak, etc.)
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks (useIDB, useOnlineStatus)
│   ├── data/          # Static data (rxnorm placeholder)
│   └── main.tsx       # Entry point
├── public/            # Static assets, service worker, offline JSON
├── api/               # Vercel serverless functions (search.js)
├── scripts/           # Data enrichment scripts
└── dist/              # Production build output
```

## Development Notes

### Mesh Gossip
- Uses BroadcastChannel for same-device tab communication (excellent for development testing)
- Web Bluetooth transport is implemented but largely limited by browser capabilities (peripheral mode not widely available); the code gracefully degrades.
- Mesh state persists to IndexedDB key `'gossip'`.

### Health Graph Encryption
- Passphrase: `vita-demo-2026` (demo only — will be replaced by a secure unlock screen)
- Key derivation: PBKDF2 with 100,000 iterations, SHA-256
- Encryption: AES-256-GCM with random 12-byte IV

### Offline AI Model
- First load downloads ~1.3 GB (Gemma 2B quantized)
- Cached in browser; subsequent runs fully offline
- Falls back to simpler models if download fails

## Known Limitations

- Web Bluetooth peripheral mode (advertising) is not supported in most desktop browsers; mesh works across tabs on same device; on real Android devices with Chrome, BLE scanning may work but actual peripheral broadcast is experimental.
- Large model download required for AI (consider progressive loading in future).
- RxNorm interaction database not yet populated (uses simple heuristics currently).

## Next Steps (Phase 4 & 5)

- Implement W3C Verifiable Credentials for health passport
- Add QR code generation for pre-visit summaries
- Integrate Capacitor for native Android APK
- Push notifications for outbreak alerts
- Real RxNorm data ingestion script

---

*VitaChain — Guardian of Care, Anywhere.*

