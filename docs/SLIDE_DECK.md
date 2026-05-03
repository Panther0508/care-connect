# VitaChain Pitch Deck Outline

## Slide 1: Title Slide
- **Title:** VitaChain
- **Tagline:** Your Health, Your Guardian
- **Team:** [Your Team Name]
- **Visuals:** VitaChain logo, sleek dark/glassmorphism aesthetic.

## Slide 2: The Problem
- Healthcare fragmentation leaves patients isolated in the Global South.
- Frequent "baton drops" between providers lead to fatal medication and triage errors.
- Lack of reliable internet prevents access to modern telehealth and digital records.

## Slide 3: The Solution
- **Four-Layer Architecture:**
  1. **Health Graph:** Encrypted, self-sovereign on-device health records.
  2. **Hybrid AI:** Online Gemma 4 + Offline TinyLlama.
  3. **Mesh Intelligence:** P2P Bluetooth/BroadcastChannel gossip network.
  4. **Universal Health Passport:** Offline QR-based W3C Verifiable Credentials.

## Slide 4: Live Demo
- **Link:** [Vercel Deployment URL](https://care-connect-lilac-nine.vercel.app)
- **Demonstration:** What the judges will see (interactive PWA, Gamification, Dashboard UIs).

## Slide 5: Offline AI Engine
- **Fully Offline:** TinyLlama 1.1B runs locally via ONNX Runtime Web.
- **Online Power:** Gemma 4 31B (1,500 free calls/day via Google AI Studio) for deep clinical reasoning.
- **Smart Caching:** High-quality Gemma responses are cached locally to teach the offline models.

## Slide 6: Data Sovereignty
- **On-Device Encryption:** AES-256-GCM secures all data locally.
- **W3C Verifiable Credentials:** Portable, tamper-evident health records.
- **Compliance:** Built strictly for NDP Act 2023 compliance. No central honeypot.

## Slide 7: Clinical AI Support
- **For Clinicians & CHWs:** Offline triage, protocol adherence, and differential diagnosis.
- **Structured Outputs:** The AI provides JSON outputs for ICD-10 codes, confidence scores, and medication interactions.

## Slide 8: Business Model
- **Freemium (Sabi):** Free tier with offline TinyLlama health guidance.
- **Premium (Oga):** ₦2,500/month (via Squad payments) for Gemma 4 online access, unlimited passport shares, and priority mesh alerts.

## Slide 9: Competition Alignment
- **Gemma 4 Good:** Demonstrates Gemma 4 API with structured function calling.
- **Abuja Innovation Challenge:** Solves a localized infrastructure problem with high-tech PWA deployment and strict data sovereignty.
- **Squad Hackathon 3.0:** Uses Squad payment rails to monetize premium health intelligence seamlessly.

## Slide 10: Roadmap & Ask
- **Current Ask:** [Specify prize money / incubator goal]
- **Future Plans:** White-label deployment for state health ministries, satellite sync integration, and DHIS2 data pipelines.
