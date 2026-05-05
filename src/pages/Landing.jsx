import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, WifiOff, Globe, Lock, Brain, QrCode, Users, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

// Glassmorphism Card Component
const GlassCard = ({ children, className = '' }) => (
  <div className={`glass-card p-6 rounded-2xl ${className}`}>
    {children}
  </div>
);

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, desc, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.03, y: -4 }}
    className="glass-card p-6 rounded-2xl group"
  >
    <div className="w-14 h-14 rounded-2xl bg-teal-500/20 flex items-center justify-center mb-4 group-hover:bg-teal-500/30 transition-all duration-300">
      <Icon size={28} className="text-teal-400" />
    </div>
    <h3 className="text-xl font-semibold text-slate-100 mb-2">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

// Testimonial Card
const TestimonialCard = ({ name, text, role }) => (
  <GlassCard className="border-l-4 border-l-teal-400">
    <p className="text-slate-200 italic mb-4 leading-relaxed">"{text}"</p>
    <div>
      <p className="text-teal-400 font-semibold text-sm">{name}</p>
      <p className="text-slate-500 text-xs">{role}</p>
    </div>
  </GlassCard>
);

// FAQ Item
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 min-h-[60px]"
      >
        <span className="font-semibold text-slate-100 text-sm md:text-base">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-teal-400" />
        </motion.div>
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-6 pb-4"
        >
          <p className="text-slate-400 text-sm leading-relaxed">{answer}</p>
        </motion.div>
      )}
    </div>
  );
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      {/* Noise texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Hero Section */}
      <section className="relative z-10 px-4 py-20 md:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-teal-400 font-medium">Abuja Innovation Challenge 2025 Finalist</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="gradient-text-teal-amber">VitaChain</span>
          </h1>
          <p className="text-xl md:text-2xl mb-6 text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Your Health, Your Guardian
          </p>
          <p className="text-base md:text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The first decentralized health platform that puts your medical data in your control.
            Works offline. Respects your privacy. Saves lives.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/sign-up"
              className="btn-primary px-8 py-4 rounded-2xl text-lg font-semibold hover:scale-105 active:scale-97 transition-all duration-200 min-h-[56px] w-full sm:w-auto"
            >
              Get Started Free
            </Link>
            <Link
              to="/sign-in"
              className="glass-card px-8 py-4 rounded-2xl text-lg font-semibold text-slate-100 hover:border-teal-400/50 hover:scale-103 active:scale-97 transition-all duration-200 min-h-[56px] w-full sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-2.5 rounded-full bg-teal-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* Problem / Solution */}
      <section className="relative z-10 px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
          >
            {/* Problem Side */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <AlertCircle size={24} className="text-rose-400" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-100">The Problem</h2>
                </div>
                <p className="text-slate-300 leading-relaxed mb-6">
                  In emergency situations, every second counts. But medical history is scattered across
                  clinics, hospitals, and paper records. Patients can't access their own data when
                  they need it most.
                </p>
                <ul className="space-y-4">
                  {[
                    '87% of deaths in emergencies occur before reaching hospital',
                    'Medical records are siloed and inaccessible',
                    'Rural communities have no reliable health infrastructure',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-rose-400 text-xs">✕</span>
                      </div>
                      <span className="text-slate-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Solution Side */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="border-l-4 border-l-teal-400">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                    <CheckCircle size={24} className="text-teal-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-100">Our Solution</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    { title: 'Personal Health Graph', desc: 'Encrypted, portable health records you control' },
                    { title: 'QR Health Passport', desc: 'Instant access for clinicians with your consent' },
                    { title: 'Mesh Intelligence', desc: 'Community outbreak detection and resource mapping' },
                    { title: 'Offline-First', desc: 'Works without internet, syncs when connectivity returns' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-teal-400 text-xs">✓</span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 text-sm">{item.title}</div>
                        <div className="text-xs text-slate-400">{item.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-100">
            Built for Real Healthcare Challenges
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Every feature designed to solve actual problems faced by patients, clinicians, and communities
          </p>
        </motion.div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <FeatureCard
            icon={Activity}
            title="Health Graph"
            desc="Automerge CRDT keeps your health history synchronized across all devices"
            delay={0.1}
          />
          <FeatureCard
            icon={Brain}
            title="Offline AI"
            desc="Gemma 2B medical AI runs on-device for symptom checking, even without internet"
            delay={0.2}
          />
          <FeatureCard
            icon={QrCode}
            title="QR Passport"
            desc="Verifiable credentials share with any clinician via QR scan"
            delay={0.3}
          />
          <FeatureCard
            icon={Globe}
            title="Mesh Network"
            desc="Bluetooth and satellite gossip protocol for community health intelligence"
            delay={0.4}
          />
          <FeatureCard
            icon={Users}
            title="137 Languages"
            desc="Offline-first translation for rural communities worldwide"
            delay={0.5}
          />
          <FeatureCard
            icon={Lock}
            title="Privacy First"
            desc="End-to-end encryption, zero-knowledge architecture, you own your data"
            delay={0.6}
          />
          <FeatureCard
            icon={WifiOff}
            title="Offline First"
            desc="Full functionality without internet, syncs when connectivity returns"
            delay={0.7}
          />
          <FeatureCard
            icon={Shield}
            title="Emergency ID"
            desc="Critical medical info accessible to first responders via lock screen"
            delay={0.8}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-100">
            What Users Say
          </h2>
          <p className="text-slate-400 text-center mb-12">Trusted by healthcare workers and patients across Africa</p>
        </motion.div>
        
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <TestimonialCard
              name="Dr. Amara"
              role="Physician, Lagos"
              text="VitaChain changed how we deliver care in rural Nigeria. Patients can finally access their full history, even without internet."
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <TestimonialCard
              name="James"
              role="Patient, Nairobi"
              text="I was in an accident and my medical history was instantly available to the ER doctors through my QR passport. It was lifesaving."
            />
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-100">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 text-center mb-12">Everything you need to know about VitaChain</p>
        </motion.div>
        
        <div className="max-w-3xl mx-auto space-y-3">
          {[
            {
              q: 'Is my health data secure?',
              a: 'Yes. All data is encrypted end-to-end with AES-256-GCM. Your encryption keys never leave your device. Not even we can access your records. We use a zero-knowledge architecture.',
            },
            {
              q: 'How does offline mode work?',
              a: 'The app caches your health records, AI models, and translations locally using IndexedDB. You can view, update, and share health data without any internet connection. Changes sync automatically when connectivity returns using CRDT technology.',
            },
            {
              q: 'Can I delete my data?',
              a: 'Absolutely. Under the Nigeria Data Protection Act and GDPR, you have the right to erasure. One tap deletes all local data and requests deletion from our servers. We provide a deletion confirmation certificate.',
            },
            {
              q: 'Is this suitable for rural areas?',
              a: 'Yes. VitaChain is specifically designed for low-connectivity environments. It works with Bluetooth mesh networks, supports 137 local languages offline, and requires minimal data usage. Community health workers can sync data via satellite when needed.',
            },
            {
              q: 'Is it free to use?',
              a: 'Yes, the core features are completely free. We offer a premium subscription for advanced features like detailed analytics, family accounts, and priority support. Our mission is to make healthcare accessible to everyone.',
            },
          ].map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <FAQItem question={faq.q} answer={faq.a} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <GlassCard className="max-w-4xl mx-auto text-center py-12 md:py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-100">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust VitaChain with their health data. 
              Free forever for basic features. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/sign-up"
                className="btn-primary px-8 py-4 rounded-2xl text-lg font-semibold hover:scale-105 active:scale-97 transition-all duration-200 min-h-[56px]"
              >
                Get Started Free
              </Link>
              <Link
                to="/health"
                className="glass-card px-8 py-4 rounded-2xl text-lg font-semibold text-slate-100 hover:border-teal-400/50 hover:scale-103 active:scale-97 transition-all duration-200 min-h-[56px]"
              >
                Explore Features
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-12 border-t border-[rgba(148,163,184,0.12)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Activity size={24} className="text-teal-400" />
              </div>
              <span className="text-xl font-bold gradient-text-teal-amber">VitaChain</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link to="/terms" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                Privacy Policy
              </Link>
              <a href="mailto:nmesirionyengbaronye@gmail.com" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                Contact Us
              </a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© 2025 VitaChain Health. All rights reserved.</p>
            <p>Proudly built for Hackathons in 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}