import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 p-4 pb-24"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Shield size={28} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: May 2026</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="no-collection" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              1. Information We Do NOT Collect
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              VitaChain does not collect, store, or transmit your personal health records to any external server. All health data resides on your device. We do not sell your data. Period.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="local-storage" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              2. Information Stored on Your Device
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              Health graph data, medication logs, nutrition entries, workout history, and other wellness metrics are stored locally using IndexedDB and encrypted with AES‑256‑GCM where applicable. This ensures you retain full ownership and control.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sharing" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              3. How You Share Data
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              When you choose to share health information, you generate a W3C Verifiable Credential (VC) that contains only the selected data. The VC is presented as a QR code or a downloadable JSON file. You decide who to share with, when, and for how long. No data leaves your device without your explicit action.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mesh" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              4. Mesh Data (Community Aggregation)
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              When you opt‑in to community health intelligence, only anonymised, hashed counters (e.g., symptom trends, facility confirmations) are exchanged via the mesh network. No personally identifiable information or patient‑level data is ever broadcast.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="third-party" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              5. Third‑Party Services
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              VitaChain may optionally integrate with Gemini API for online AI inference and LangSearch for web‑based medical queries. When these services are used, queries are sent under your own API keys (if provided) and are subject to those providers' privacy policies. We do not log query contents on our servers.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rights" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              6. Your Rights
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              You may export your data at any time (JSON or PDF), delete specific records, or wipe all local data. You have the right to data portability under the Nigeria Data Protection Regulation (NDPR) Act 2023 and the EU's General Data Protection Regulation (GDPR) where applicable. Contact us for any privacy exercise.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contact" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              7. Contact
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              For privacy‑related inquiries, please email us at nmesirionyengbaronye@gmail.com or visit our GitHub repository.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </motion.div>
  );
}
