# VitaChain Final Release Task Plan

## Phase 1: AI Reasoning & Thought Display
1. Create src/components/ReasoningPanel.jsx if missing with collapsible glass card specification
2. Create src/components/CitationBadge.jsx if missing with inline citation badge specification
3. Integrate ReasoningPanel and CitationBadge into src/pages/AIAssistant.jsx (patient chat)
4. Integrate ReasoningPanel and CitationBadge into clinician AI chat component (find where clinician AI responses are rendered)
5. Integrate ReasoningPanel and CitationBadge into src/pages/CHWTriage.jsx (CHW chat)
6. Verify and modify src/services/hybridAIRouter.js to ensure routeQuery returns reasoning array and citations array alongside text

## Phase 2: Admin Pages
7. Verify src/pages/dashboards/AdminDashboard.jsx exists and is complete; if stub, rebuild with:
   - Section 1: Greeting and header with admin display name and current date
   - Section 2: Three statistics cards (Total Users, Active Users 7-Day, Consents This Month)
   - Section 3: User management table with columns Name, Email, Role, Status, Last Active, Actions
   - Section 4: Consent log summary card
   - Section 5: Quick-link buttons (Audit Log, Training Dashboard, Organization Settings)
8. Verify src/pages/AuditLog.jsx exists and is complete with route /audit-log, chronological log, filtering, and CSV export
9. Verify src/pages/TrainingDashboard.jsx exists and is complete with route /training, showing training pairs, last cycle date, diversity score, run training cycle button, and top-10 topics
10. Verify all three admin routes (/audit-log, /training, admin dashboard route) are defined in src/App.jsx and protected by role guard (only admin role can access)

## Phase 3: Premium UI Verification
11. Verify glassmorphism standard applied to every card, modal, toast, and input field:
    background: rgba(30,41,59,0.65);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(148,163,184,0.12);
    border-radius: 1.25rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04);
12. Verify color palette compliance:
    - Background: #0F172A
    - Surface: rgba(30,41,59,0.65)
    - Primary: #14B8A6
    - Accent: #F59E0B
    - Success: #10B981
    - Danger: #EF4444
    - Text primary: #F1F5F9
    - Text secondary: #94A3B8
    - Text disabled: #475569
    - Border: rgba(148,163,184,0.12)
13. Verify every data-driven page handles loading, empty, and error states with VitaAvatar and appropriate UI
14. Verify button feedback: scale to 0.97 on press, 1.0 on release, hover scale 1.03 with teal glow, disabled 50% opacity, haptic feedback on tap
15. Verify thin teal scrollbars via WebKit and Firefox rules in src/index.css with no conflicting styles
16. Verify focus rings: focus-visible:ring-2 ring-teal-500/30 on every interactive element
17. Verify accessibility: prefers-reduced-motion (instant animations), prefers-reduced-transparency (solid #1E293B), alt text on images, aria-label on icons, touch targets ≥44×44px, contrast ratio ≥4.5:1
18. Verify toast notifications: slide in from top with spring, progress bar over 4000ms, auto-dismiss after 4s, stack up to 3, Vita avatar + title + message
19. Verify bottom navigation: fixed full-width 64px backdrop-blur-2xl, active item teal glow + bounce, hamburger drawer slides from right with spring glass background

## Phase 4: Service Worker Caching
20. Open public/serviceWorker.js and verify install event handler includes in cache.addAll():
    - All files under public/data/ (.json files)
    - All files under public/images/ (exercise images, food SVGs, body map SVGs, health icons, medical images, first aid images)
    - All files under public/avatars/ (vita-*.png images)
    - HuggingFace CDN model URLs for all models in model loader
    - Main JS bundle, CSS, index.html
    - manifest.json, favicon.ico
21. Verify activate event cleans old caches and fetch event uses CacheFirst for static assets/model files, NetworkFirst for API calls

## Phase 5: IndexedDB Migration Integrity
22. Open src/lib/idb.js and verify migration chain includes all required object stores with correct versions:
    - healthGraph, facilities, vectors, needs, meshState, searchLogs, userProfile
    - foodLogs, workoutLogs, cycleData, dailyHydration, sleepLogs, medicationLogs
    - medicationReminders, appointments, medicationFeedback, documents, healthGoals
    - dependents, smokingCessation, alcoholLog, symptomDiary, painTracker, moodTracker
    - glucoseLog, bloodPressureLog, peakFlowLog, pelvicDiary, weightTracker, progressPhotos
    - datasetVectors, gemmaCache, ragVectors, trainingPairs, realtimeCache, translationCache
23. For each store, verify migration version that added it is correct; if missing from migration chain, add with appropriate version bump
24. If version number not bumped since last store addition, bump it and add migration

## Phase 6: Error Boundaries
25. Verify src/components/ErrorBoundary.jsx exists as React class component; if missing, create it
26. Verify src/components/ErrorFallback.jsx exists; if missing, create it with Vita-error avatar, "Something went wrong" heading, error message subtitle, teal "Retry" button, slate "Go Home" link to /dashboard
27. Open src/App.jsx and verify every route's element is wrapped either directly or indirectly in <ErrorBoundary>; if missing, wrap entire <Routes> block:
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>…</Routes>
      </Suspense>
    </ErrorBoundary>

## Phase 7: Hybrid Router Fallback Ladder Trace
28. Open src/services/hybridAIRouter.js and trace fallback ladder:
    - Level 1: Gemini API (Gemma 4 31B) - catch errors and proceed to Level 2
    - Level 2: OpenRouter (free tier) - if fails, proceed to Level 3
    - Level 3: HuggingFace Serverless - if fails, proceed to Level 4
    - Level 4: gemmaCache (cosine similarity on cached Gemma responses) - if no match >0.75 threshold, proceed to Level 5
    - Level 5: TinyLlama 1.1B (offline generation) - always works
29. Ensure at NO point does an error throw to UI; every catch block must return fallback response, never re-throw
30. Fix any empty catch blocks or throw statements

## Phase 8: Emotion & Crisis Detection on All Role Chats
31. Verify src/services/emotionDetector.js imported and called in message-send handler of:
    - src/pages/AIAssistant.jsx (patient)
    - Clinician chat page (find where clinician AI responses rendered)
    - src/pages/CHWTriage.jsx (CHW)
32. Verify emotionDetector.detectEmotion(userInput) called before AI call and result passed to hybrid router
33. Verify src/services/crisisDetector.js imported and called in same three chat pages:
    - scanMessage(userText) called BEFORE AI call
    - scanAIResponse(aiText) called AFTER AI call
    - If either returns requiresImmediatePopup: true, CrisisPopup opens
34. Verify hybrid router accepts emotional state and passes it to persona engine for emotionally adaptive system prompt; if routeQuery signature lacks emotionalState parameter, add it and thread through to persona engine

## Phase 9: Subscription Gate on Premium Features
35. Verify src/components/PlanGate.jsx exists and correctly gates premium features:
    - Checks Clerk publicMetadata for subscription: 'premium' and subscriptionExpiry not expired
    - Falls back to IndexedDB if offline
    - If subscription active, renders children
    - If not, renders SquadPaymentModal as upsell overlay
36. Verify PlanGate wraps at least these premium features:
    - Unlimited passport shares ("Share via Passport" functionality)
    - Advanced AI queries (queries calling online Gemma 4 path)
    - Priority mesh (if implemented)
    - All-language offline translation (if behind gate)
37. Wrap any premium feature not currently gated with <PlanGate>

## Phase 10: Consent Management on Clinician Passport Scan
38. Open src/services/consentManager.ts (or .js) and verify exports:
    - grantConsent(patientDID, clinicianDID, scope, duration)
    - revokeConsent(consentId)
    - isConsentValid(patientDID, clinicianDID, scope)
    - getConsentLog()
39. Open clinician passport scan flow (likely src/pages/ClinicianView.jsx or QR scanner component) and verify BEFORE displaying scanned patient data, consent manager called to grant time-limited consent valid for encounter only
40. Verify consent logged to IndexedDB with timestamp, patient DID (anonymized), clinician DID, scope, and expiry
41. Verify after encounter, clinician can "End Session" which revokes consent and clears displayed patient data from screen

## Phase 11: Referral Code Immutability
42. Open src/services/referralEngine.js (or wherever referral codes generated) and verify:
    - Referral code generated ONCE per user using crypto.randomUUID()
    - Code stored in Clerk publicMetadata.referralCode AND localStorage
    - generateReferralCode() FIRST checks if code exists in either storage location
    - If code exists, RETURNS existing code — never regenerates
    - Code immutable for lifetime of account
43. If function always generates new code, fix to check first

## Phase 12: Hamburger Drawer on All New Pages
44. Verify ModernBottomNav component (containing hamburger drawer) present on:
    - Education Hub (/education, /education/:moduleId)
    - Community Hub (/community, /community/:topicId, /community/:topicId/:postId)
    - Rewards (/rewards)
    - Quests (/quests)
    - Care Locator (/care-locator)
    - Image Library (/images)
    - Clinician Profile (/clinician-profile)
    - Patient History (/patient-history)
    - Referral Generator (/referral-generator)
    - CHW Triage (/chw-triage)
    - Protocol Navigator (/protocol-navigator)
    - Encounter Logger (/encounter-logger)
45. If any page missing navigation component, add it

## Phase 13: Right to Erasure (Full Data Wipe)
46. Open Settings page (likely src/pages/Settings.jsx) and verify "Delete Account" section exists; if missing, add it
47. Verify "Delete Account" flow:
    - Shows confirmation dialog with amber warning icon and text:
      "This action is permanent. All your health data, messages, rewards, and settings will be permanently deleted. This cannot be undone."
    - Two buttons: "Cancel" (outline) and "Delete Everything" (red)
    - When confirmed:
        a. Delete ALL IndexedDB stores (every object store in database)
        b. Clear ALL localStorage keys
        c. If Clerk configured, call Clerk user deletion API
        d. Revoke all active consents via consentManager
        e. Navigate to / (landing page)
        f. Show toast: "Your account and all data have been permanently deleted."
48. If Delete flow is stub (only message with no implementation), implement fully using existing IndexedDB helper and Clerk API

## Phase 14: Voice & Translation Buttons on All Chat Interfaces
49. Verify every chat interface (patient, clinician, CHW) contains three buttons in input bar:
    - 🎤 Microphone button: calls speechRecognition.js (Whisper + Web Speech fallback); pulses when available, turns red while recording
    - 🔊 Speaker button: calls speechSynthesis.js (Web Speech API); appears next to each AI response bubble; animates with sound-wave bars while speaking
    - 🌐 Translate button: calls translationService.js (NLLB-200); appears next to AI responses; cross-fades to translated text on tap
50. If any chat interface missing these buttons, add them

## Phase 15: Build, Commit, Sync
51. Run npm install to ensure all packages in sync
52. Run npm run build; must complete with ZERO errors and ZERO warnings
    - If build fails, fix root cause and re-run until passes
53. After successful build, record:
    - Total bundle size
    - Size of largest individual JS chunk
    - Number of chunks
54. Test every API endpoint on localhost:
    - POST /api/search → must return 200 with results array
    - POST /api/feedback → must return 200
    - GET /api/impact → must return 200 with JSON
    - POST /api/satellite-ingest → must return 200
    - If any endpoint fails, fix it and re-test until returns 200
55. Stage all changes: git add -A
56. Commit with exact message:
    "Final release: AI reasoning display, admin pages, premium UI verification, service worker hardening, IndexedDB migrations, error boundaries, fallback ladder, emotion/crisis detection all roles, consent management, referral immutability, hamburger on all pages, right to erasure, voice/translation buttons"
57. Push: git push origin main

## Phase 16: Final Report
58. Output structured report as specified in prompt (to be done after execution completes)