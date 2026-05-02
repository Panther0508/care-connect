# VitaChain Release Engineering Task Plan

## Phase 1: Open-Source Community Files
1. Create SECURITY.md at project root with:
   - Title: "Security Policy"
   - Section "Reporting a Vulnerability": explain private reporting via email to security@vitachain.health or GitHub's private vulnerability reporting
   - Section "Response Timeline": acknowledge within 48 hours, initial assessment within 5 business days, patch within 30 days
   - Section "Supported Versions": list versions receiving security updates (v0.x — pre-release)
   - Section "Disclosure Policy": coordinated disclosure with 90-day deadline

2. Create CODE_OF_CONDUCT.md at project root:
   - Use Contributor Covenant v2.1 text from https://www.contributor-covenant.org/version/2/1/code_of_conduct/
   - Replace [INSERT CONTACT METHOD] with conduct@vitachain.health

3. Create CONTRIBUTING.md at project root:
   - Section "Welcome": brief statement welcoming contributions
   - Section "Development Setup": clone repo, npm install, node scripts/download-all-data.mjs, npm run dev
   - Section "Pull Request Process": open issue first, create feature branch off main, write tests if applicable, ensure npm run build passes, request review
   - Section "AI Usage Disclosure": LLM-generated contributions must be disclosed in PR description
   - Section "Code Style": follow existing ESLint and Prettier config; use functional React components with hooks; all text in Plus Jakarta Sans with existing Tailwind theme

4. Update README.md:
   - Add three new badges below license badge:
     [![Security Policy](https://img.shields.io/badge/Security-Policy-blue)](SECURITY.md)
     [![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Contributor%20Covenant%202.1-4baaaa)](CODE_OF_CONDUCT.md)
     [![Contributing](https://img.shields.io/badge/Contributing-Guide-brightgreen)](CONTRIBUTING.md)

## Phase 2: Security Headers in vercel.json
5. Open vercel.json at project root (create if missing)
6. Extend headers array with security headers for ALL routes (source: "/(.*)"):
   - Content-Security-Policy: "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://huggingface.co blob:; connect-src 'self' https://generativelanguage.googleapis.com https://api.openrouter.ai https://api-inference.huggingface.co https://api.search.brave.com https://eutils.ncbi.nlm.nih.gov https://clinicaltrials.gov https://api.fda.gov https://ghoapi.azureedge.net https://disease.sh https://overpass-api.de https://healthsites.io https://*.upstash.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://raw.githubusercontent.com; media-src 'self'; worker-src 'self' blob:"
   - X-Frame-Options: "DENY"
   - X-Content-Type-Options: "nosniff"
   - Referrer-Policy: "strict-origin-when-cross-origin"
   - Permissions-Policy: "camera=(self), microphone=(self), bluetooth=(self), geolocation=(self)"
   - Strict-Transport-Security: "max-age=63072000; includeSubDomains; preload"

7. Add specific source rule for service worker (never cached by CDN):
   - source: "/sw.js"
   - headers: Cache-Control: public, max-age=0, must-revalidate

8. Add specific source rule for manifest:
   - source: "/manifest.webmanifest"
   - headers: Content-Type: application/manifest+json

9. Add specific source rule for static assets (long-term caching):
   - source: "/assets/(.*)"
   - headers: Cache-Control: max-age=31536000, immutable

10. Verify rewrites array still contains SPA fallback: { "source": "/(.*)", "destination": "/index.html" }

## Phase 3: PWA Installability Improvements
11. Open public/manifest.json (or manifest.webmanifest) and verify/add:
    - name: "VitaChain — Your Health, Your Guardian"
    - short_name: "VitaChain"
    - start_url: "/"
    - display: "standalone"
    - background_color: "#0F172A"
    - theme_color: "#0F172A"
    - icons: at least 192×192 (/icon-192.png) and 512×512 (/icon-512.png) in public/
    - description: "Offline‑first, self‑sovereign AI health guardian for the Global South."

12. Create src/hooks/usePWAInstall.js:
    - Listen for beforeinstallprompt event
    - Store event in ref for later triggering
    - Export isInstallable (boolean), installApp() (calls deferredPrompt.prompt()), isIOS (boolean from user-agent detection)
    - Detect if app already installed (window.matchMedia('(display-mode: standalone)').matches)

13. Open src/pages/Settings.jsx (or Settings page):
    - Add "Install App" section:
      * If browser supports beforeinstallprompt (isInstallable true): show glass button "Install VitaChain on Your Phone" calling installApp()
      * If browser is iOS (isIOS true): show iOS-specific instructions in glass card: "To install VitaChain on your iPhone or iPad: tap Share button (📤) in Safari, then scroll down and tap 'Add to Home Screen'."
      * If app already installed (display-mode: standalone): show "✅ VitaChain is installed."

14. Open public/serviceWorker.js:
    - Verify install event fires and pre-caches index.html, main JS bundle, CSS, and all dataset JSON files
    - Verify fetch event uses CacheFirst for static assets and model files, NetworkFirst for API calls

## Phase 4: Competition Packaging: Demo Scripts, Slides & Citations
15. Create SLIDE_DECK.md at project root:
    - Plain-text outline for 10-slide pitch deck with title and bullet points for each slide:
      1. Title Slide (VitaChain logo + tagline + your name)
      2. The Problem (healthcare fragmentation, medication errors)
      3. The Solution (four-layer architecture: health graph, AI, mesh, passport)
      4. Live Demo (link to Vercel deployment)
      5. Offline AI (Gemma 4 online + TinyLlama offline)
      6. Data Sovereignty (GDPR/NDP Act compliance)
      7. Clinical AI (clinician + CHW capabilities)
      8. Business Model (freemium + Squad payments)
      9. Competition Alignment (why this wins Kaggle / Abuja / Squad)
      10. Roadmap + Ask (what you'll do with prize money)

16. Update DEMO_SCRIPT.md:
    - Add table at top with competitions and requirements:
      | Competition | Deadline | Video Length | Report | Public Repo |
      |---|---|---|---|---|
      | Kaggle Gemma 4 Good | 18 May 2026 | ≤ 3 min | ≤ 1,500 words | Required |
      | Abuja Innovation Challenge | 31 May 2026 | ≤ 3 min (recommended) | Pitch deck | Not required |
      | Squad Hackathon 3.0 | Check portal | Check portal | Check portal | Check portal |
    - Add timing markers for 3-minute cut

17. Create CITATIONS.md at project root:
    - List every AI tool, dataset, open-source library, and external API used in format:
      ### AI Tools
      - Kilo Code (kilo-auto/free): used for generating prompts and debugging aid
      - Google AI Studio (Gemini API): used for online clinical reasoning (Gemma 4 31B via free tier)
      ### Datasets
      - free-exercise-db (Unlicense): 800+ exercises
      - FAO WAFCT 2019: 472 West African foods
      - FirstAidQA (HuggingFace): 5,500 first-aid Q&A pairs
      - RxNorm (NIH): drug interaction database
      - ICD-10-CM 2026 (CMS): diagnostic codes
      - [continue with all datasets]
      ### Open-Source Libraries
      - Transformers.js (Apache 2.0): on-device AI inference
      - Automerge (MIT): CRDT health graph
      - [continue with all major dependencies]
      ### APIs
      - Brave Search API (free tier, 2,000 queries/month)
      - PubMed E-utilities (free, no auth)
      - ClinicalTrials.gov v2 (free, no auth)
      - OpenFDA (free tier, 1,000 requests/day)
      - WHO GHO OData API (free, no auth)
      - disease.sh (free, no auth)
      - [continue with all APIs]

18. Update README.md:
    - After competition sections, add "Citations" section linking to CITATIONS.md
    - Add "Project Status" badge at top: [![Project Status: Active](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)

## Phase 5: GitHub Repository Hygiene
19. Clean up temporary branches:
    - List all local branches with git branch
    - Delete every branch except main and any release/* branch: git branch -D <branch-name>

20. Create release tag:
    - Run: git tag -a v1.0.0-beta -m "VitaChain Beta — competition submission release"
    - Run: git push origin v1.0.0-beta

21. Create GitHub Release:
    - Title: "VitaChain v1.0.0-beta — Competition Release"
    - Attach APK file (android/app/build/outputs/apk/debug/app-debug.apk) as release asset
    - In release notes, link to live demo, YouTube video (placeholder), and slide deck

22. Configure GitHub repository settings:
    - Go to repo → Settings → "About" section
    - Add short description: "Offline-first, self-sovereign AI health guardian for the Global South."
    - Add live demo URL: https://care-connect-lilac-nine.vercel.app
    - Add topics: healthcare, ai, pwa, offline-first, gemma, transformers-js, react, vite, capacitor, ndp-act, global-health, mesh-network, hackathon

23. Enable GitHub Discussions (optional but recommended):
    - Go to repo → Settings → Features → enable Discussions

## Phase 6: Final Verification
24. Run npm install to ensure all packages synced
25. Run npm run build (must pass with zero errors)
26. Verify every link in README.md, SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md, and CITATIONS.md is not broken
27. Verify live deployment loads over HTTPS with no mixed-content warnings
28. Stage, commit, and push:
    git add -A
    git commit -m "Public release readiness: community files, security headers, PWA installability, competition packaging, repo hygiene"
    git push origin main
    git push origin v1.0.0-beta