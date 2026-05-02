# VitaChain Final Closure Task Plan

## Phase 1: IP Protection & Licensing

1. Create LICENSE file at project root with AGPL-3.0 text from https://www.gnu.org/licenses/agpl-3.0.txt
2. Create NOTICE.md file at project root listing all third-party dependencies with licenses
3. Create src/lib/integrityGuard.js if missing, exporting initIntegrityGuards() that checks window.location.origin against allowed origins and shows unauthorized message if not matched
4. Modify src/main.jsx to import and call initIntegrityGuards() before ReactDOM.createRoot
5. Add patent marking to README.md after title line and license badge

## Phase 2: Admin Pages

6. Rebuild src/pages/dashboards/AdminDashboard.jsx with statistics cards, user management table, consent log summary, and quick links
7. Create src/pages/AuditLog.jsx with route /audit-log displaying chronological admin actions log with filtering and CSV export
8. Create src/pages/TrainingDashboard.jsx with route /training showing AI self-training engine metrics and run training cycle button

## Phase 3: APK Build Verification

9. Verify Capacitor installation (@capacitor/core and @capacitor/cli)
10. Verify Android platform exists, add if missing
11. Verify capacitor.config.ts exists with correct values (appId, appName, webDir, server.androidScheme)
12. Sync web assets to Android after build
13. Verify Android permissions in AndroidManifest.xml (BLUETOOTH, BLUETOOTH_ADMIN, BLUETOOTH_CONNECT, BLUETOOTH_SCAN, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, INTERNET, CAMERA)
14. Build APK via Android Studio and upload to GitHub Releases with tag v1.0.0-beta
15. Document APK build steps in README.md if Android Studio unavailable

## Phase 4: Feature Hub Verification & Creation

16. Verify/create Education Hub: src/pages/EducationPage.jsx (route /education) and src/pages/EducationModule.jsx (route /education/:moduleId)
17. Verify/create Community Hub: src/pages/CommunityPage.jsx (route /community), src/pages/TopicFeed.jsx (route /community/:topicId), src/pages/PostDetail.jsx (route /community/:topicId/:postId)
18. Verify/create Rewards Page: src/pages/RewardsPage.jsx (route /rewards)
19. Verify/create Quests Page: src/pages/QuestsPage.jsx (route /quests)
20. Verify/create Care Locator: src/pages/CareLocator.jsx (route /care-locator)
21. Create Image Library Page: src/pages/ImageLibrary.jsx (route /images)
22. Verify/create Clinician-Unique Pages: src/pages/ClinicianProfile.jsx (route /clinician-profile), src/pages/PatientHistory.jsx (route /patient-history), src/pages/ReferralGenerator.jsx (route /referral-generator)
23. Verify/create CHW-Unique Pages: src/pages/CHWTriage.jsx (route /chw-triage), src/pages/ProtocolNavigator.jsx (route /protocol-navigator), src/pages/EncounterLogger.jsx (route /encounter-logger)

## Phase 5: Squad Payment Integration

24. Install @squadco/js package
25. Create src/services/squadPayment.js with Squad payment service functions
26. Create src/components/SquadPaymentModal.jsx for premium plan subscription
27. Create src/components/PlanGate.jsx for gating premium features
28. Rebuild src/pages/Subscription.jsx with plan comparison and subscription status

## Phase 6: Backup & Restore Service

29. Create src/services/backupService.js with exportAllData() and importAllData(file) functions
30. Add Backup and Restore buttons to Settings → Export tab in src/pages/Settings.jsx

## Phase 7: Camera / Scanner Reliability Fix

31. Fix QR scanner component (src/components/QRScanner.jsx or equivalent) with useEffect guard, fallback to scan from image, stop scanner after success, and always visible scan from image button
32. If html5-qrcode unreliable, replace with @uides/react-qr-reader and update scanner component

## Phase 8: Reasoning Panel & Citation Badges

33. Create src/components/ReasoningPanel.jsx for collapsible reasoning steps display
34. Create src/components/CitationBadge.jsx for inline citation badges with tooltips
35. Integrate both into src/components/AIAssistant.jsx to show reasoning toggle and citation badges in AI responses

## Phase 9: Mesh Peer-Count Badge on CHW Dashboard

36. Verify src/services/meshOrchestrator.js exports getConnectedPeerCount() function
37. Modify src/pages/dashboards/CHWDashboard.jsx to add peer count badge in header showing nearby devices count

## Phase 10: Demo Script & Competition README Sections

38. Create DEMO_SCRIPT.md at project root with 90-second demo script timestamped
39. Update README.md with competition-specific sections for Gemma 4 Good Hackathon, Abuja Innovation Challenge, and Squad Hackathon 3.0

## Phase 11: Final Verification, Build, Commit, Sync

40. Run npm install to ensure all packages present
41. Run npm run build and verify zero errors/warnings
42. Verify dist/index.html, dist/manifest.json, avatar PNGs, dataset JSONs exist
43. Stage all changes with git add -A
44. Commit with message: "Final closure: IP protection, admin pages, APK, feature hubs, Squad payment, backup/restore, camera fix, reasoning panel, mesh peer UI, demo script, competition README"
45. Push to origin main

## Phase 12: Final Report

46. Output structured Markdown report as specified in prompt