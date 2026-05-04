import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 p-4 pb-24"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
          <FileText size={28} className="text-teal-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Last updated: May 2026</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="acceptance" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              1. Acceptance of Terms
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              By accessing or using VitaChain, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="description" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              2. Description of Service
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              VitaChain is a personal health intelligence platform that provides AI‑driven insights, health graph visualisation, medication tracking, and secure sharing of health data via Verifiable Credentials. The service runs primarily on‑device with optional online AI augmentation. We do not provide medical diagnosis or emergency care.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="disclaimer" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              3. Medical Disclaimer
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              Vita AI is not a licensed medical professional. The information provided is for general informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. In case of emergency, contact your local emergency services immediately.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="responsibilities" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              4. User Responsibilities
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              You agree to provide accurate and complete health information, maintain the security of your passphrase and account, and use the platform only for lawful purposes. You are responsible for all activities under your account and for backing up your data where applicable.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="privacy" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              5. Data & Privacy
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              Your health data is stored locally on your device and encrypted with AES‑256‑GCM. We do not store your personal health records on our servers. When you share data, you control every credential via W3C Verifiable Credentials. For more details, see our Privacy Policy.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ip" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              6. Intellectual Property
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              The VitaChain platform and its source code are released under the AGPL‑3.0 license. You are free to use, modify, and distribute the software under the terms of that license. All trademarks and branding are the property of VitaChain unless otherwise noted.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="liability" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              7. Limitation of Liability
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              To the fullest extent permitted by law, VitaChain and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service. Our total liability shall not exceed the amount you paid us, if any, in the past six months.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="termination" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              8. Termination
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              We may terminate or suspend your access at any time, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, the community, or the platform. Upon termination, all data stored on your device remains yours; server‑side caches are deleted.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="governing-law" className="border-b border-white/5">
            <AccordionTrigger className="text-lg font-semibold text-slate-100 hover:text-teal-400">
              9. Governing Law
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 text-sm leading-relaxed pt-2">
              These terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising under these terms shall be resolved in the courts of Lagos State, Nigeria.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <p className="text-xs text-slate-500 text-center leading-relaxed">
        By using VitaChain, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
      </p>
    </motion.div>
  );
}
