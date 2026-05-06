import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, WifiOff, Globe, Lock, Brain, QrCode, Users, AlertCircle, CheckCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { useState } from 'react';

// Glassmorphism Card Component
const GlassCard = ({ children, className = '' }) => (
  <div className={`glass-card p-6 rounded-2xl ${className}`}>
    {children}
  </div>
);

// Feature Card Component with gradient backgrounds
const FeatureCard = ({ icon: Icon, title, desc, delay = 0, colorFrom = 'from-teal-500', colorTo = 'to-cyan-500' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.03, y: -4 }}
    className="glass-card p-6 rounded-2xl group relative overflow-hidden"
  >
    {/* Gradient background on hover */}
    <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom}/5 ${colorTo}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    
    {/* Icon container with gradient */}
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorFrom} ${colorTo} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 relative z-10`}>
      <Icon size={28} className="text-white drop-shadow-sm" />
    </div>
    
    <h3 className="text-xl font-semibold text-slate-100 mb-2 relative z-10">{title}</h3>
    <p className="text-slate-400 text-base leading-relaxed relative z-10">{desc}</p>
  </motion.div>
);

// Testimonial Card
const TestimonialCard = ({ name, text, role }) => (
  <GlassCard className="border-l-4 border-l-teal-400 bg-slate-800/40">
    <p className="text-slate-200 italic mb-4 leading-relaxed text-base">"{text}"</p>
    <div>
      <p className="text-teal-400 font-semibold text-base">{name}</p>
      <p className="text-slate-400 text-sm">{role}</p>
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
        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 min-h-[60px] hover:bg-slate-800/30 transition-colors"
      >
        <span className="font-semibold text-slate-100 text-base">{question}</span>
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
          <p className="text-slate-300 text-base leading-relaxed">{answer}</p>
        </motion.div>
      )}
    </div>
  );
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-slate-100 relative overflow-hidden">
      {/* Animated background elements for depth */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Radial gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-3xl animate-pulse-slow" style={{
          background: 'radial-gradient(circle at center, rgba(20, 184, 166, 0.12) 0%, transparent 60%)'
        }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-3xl animate-pulse-slow" style={{
          background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.08) 0%, transparent 60%)',
          animationDelay: '1s'
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full blur-2xl" style={{
          background: 'radial-gradient(circle at center, rgba(52, 211, 153, 0.05) 0%, transparent 50%)'
        }} />
        
        {/* Grid pattern for texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 2px, transparent 0)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header - elevated with backdrop */}
      <header className="relative z-30 px-4 py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-slate-900/60 shadow-lg shadow-black/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
            <Activity className="text-white" size={26} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">VitaChain</span>
        </div>
        <div className="flex gap-4">
          <Link
            to="/sign-in"
            className="px-5 py-2.5 text-base text-slate-300 hover:text-white transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 rounded-xl font-bold text-base text-white transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Memorial tag */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500/15 to-rose-500/5 border border-rose-500/30 mb-8 backdrop-blur-sm"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse shadow-sm" />
            <span className="text-base text-rose-200 font-medium">In Memory of all those who died of Cancer</span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight drop-shadow-lg">
            <span className="gradient-text-teal-amber">VitaChain</span>
          </h1>
          <p className="text-3xl md:text-4xl mb-6 text-slate-200 max-w-4xl mx-auto leading-tight font-medium">
            Your Health, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">Intelligently Managed</span>
          </p>
          <p className="text-lg md:text-xl text-slate-400 mb-16 max-w-2xl mx-auto leading-relaxed">
            VitaChain combines clinical-grade health tracking with a personal AI assistant that understands your unique profile.
            <br className="hidden md:block" />
            Take control of your health journey today.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link
              to="/sign-up"
              className="px-12 py-5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 rounded-2xl font-bold text-xl text-white transition-all shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.03] min-h-[64px] w-full sm:w-auto flex items-center justify-center gap-3"
            >
              Start Free
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/ai"
              className="px-12 py-5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 hover:border-teal-500/40 rounded-2xl font-semibold text-xl text-white transition-all hover:scale-[1.03] min-h-[64px] w-full sm:w-auto flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              Try AI Assistant
            </Link>
          </div>
        </motion.div>

        {/* Floating feature badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-3 mt-20"
        >
          {[
            { icon: Brain, label: "AI-Powered Insights" },
            { icon: Shield, label: "End-to-End Encrypted" },
            { icon: Activity, label: "Health Graph Tracking" },
            { icon: Globe, label: "Multi-Language Support" },
            { icon: Users, label: "Family Profiles" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-800/70 border border-slate-700/50 text-slate-300 text-base font-medium backdrop-blur-sm hover:border-teal-500/40 transition-all"
            >
              <item.icon size={18} className="text-teal-400" />
              {item.label}
            </div>
          ))}
        </motion.div>
      </section>

      {/* Problem / Solution Section */}
      <section className="relative z-10 px-4 py-20 md:py-28">
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
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/30 to-rose-600/20 flex items-center justify-center border border-rose-500/30">
                    <AlertCircle size={28} className="text-rose-400" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-100">The Problem</h2>
                </div>
                <p className="text-xl text-slate-300 leading-relaxed mb-8">
                  In emergency situations, every second counts. But medical history is scattered across
                  clinics, hospitals, and paper records. Patients can't access their own data when
                  they need it most.
                </p>
                <ul className="space-y-5">
                  {[
                    '87% of deaths in emergencies occur before reaching hospital',
                    'Medical records are siloed and inaccessible',
                    'Rural communities have no reliable health infrastructure',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/30">
                        <span className="text-rose-400 text-sm font-bold">✕</span>
                      </div>
                      <span className="text-slate-300 text-lg">{item}</span>
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
              <GlassCard className="border-l-4 border-l-teal-400 bg-slate-800/40">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/30 to-emerald-500/20 flex items-center justify-center border border-teal-500/30">
                    <CheckCircle size={28} className="text-teal-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-100">Our Solution</h3>
                </div>
                <ul className="space-y-5">
                  {[
                    { title: 'Personal Health Graph', desc: 'Encrypted, portable health records you control' },
                    { title: 'QR Health Passport', desc: 'Instant access for clinicians with your consent' },
                    { title: 'Mesh Intelligence', desc: 'Community outbreak detection and resource mapping' },
                    { title: 'Offline-First', desc: 'Works without internet, syncs when connectivity returns' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5 border border-teal-500/30">
                        <span className="text-teal-400 text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 text-lg">{item.title}</div>
                        <div className="text-slate-400 text-base">{item.desc}</div>
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
      <section className="relative z-10 px-4 py-20 md:py-28 bg-slate-900/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-slate-100">
            Built for Real Healthcare Challenges
          </h2>
          <p className="text-xl text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Every feature designed to solve actual problems faced by patients, clinicians, and communities
          </p>
        </motion.div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          <FeatureCard
            icon={Activity}
            title="Health Graph"
            desc="Automerge CRDT keeps your health history synchronized across all devices"
            delay={0.1}
            colorFrom="from-emerald-500"
            colorTo="to-teal-500"
          />
          <FeatureCard
            icon={Brain}
            title="Offline AI"
            desc="Gemma 2B medical AI runs on-device for symptom checking, even without internet"
            delay={0.2}
            colorFrom="from-violet-500"
            colorTo="to-purple-500"
          />
          <FeatureCard
            icon={QrCode}
            title="QR Passport"
            desc="Verifiable credentials share with any clinician via QR scan"
            delay={0.3}
            colorFrom="from-cyan-500"
            colorTo="to-blue-500"
          />
          <FeatureCard
            icon={Globe}
            title="Mesh Network"
            desc="Bluetooth and satellite gossip protocol for community health intelligence"
            delay={0.4}
            colorFrom="from-blue-500"
            colorTo="to-indigo-500"
          />
          <FeatureCard
            icon={Users}
            title="137 Languages"
            desc="Offline-first translation for rural communities worldwide"
            delay={0.5}
            colorFrom="from-amber-500"
            colorTo="to-orange-500"
          />
          <FeatureCard
            icon={Lock}
            title="Privacy First"
            desc="End-to-end encryption, zero-knowledge architecture, you own your data"
            delay={0.6}
            colorFrom="from-rose-500"
            colorTo="to-red-500"
          />
          <FeatureCard
            icon={WifiOff}
            title="Offline First"
            desc="Full functionality without internet, syncs when connectivity returns"
            delay={0.7}
            colorFrom="from-slate-500"
            colorTo="to-gray-500"
          />
          <FeatureCard
            icon={Shield}
            title="Emergency ID"
            desc="Critical medical info accessible to first responders via lock screen"
            delay={0.8}
            colorFrom="from-amber-500"
            colorTo="to-yellow-500"
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-slate-100">
            What Users Say
          </h2>
          <p className="text-xl text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Trusted by healthcare workers and patients across Africa
          </p>
        </motion.div>
        
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 md:gap-8">
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
      <section className="relative z-10 px-4 py-20 md:py-28 bg-slate-900/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-slate-100">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Everything you need to know about VitaChain
          </p>
        </motion.div>
        
        <div className="max-w-3xl mx-auto space-y-4">
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
      <section className="relative z-10 px-4 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <GlassCard className="max-w-4xl mx-auto text-center py-16 md:py-20 bg-gradient-to-br from-teal-900/30 to-cyan-900/20 border-teal-500/20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-100">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Join thousands of users who trust VitaChain with their health data. 
              Free forever for basic features. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link
                to="/sign-up"
                className="px-12 py-5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 rounded-2xl font-bold text-xl text-white transition-all shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.03] min-h-[64px]"
              >
                Get Started Free
              </Link>
              <Link
                to="/health"
                className="px-12 py-5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 hover:border-teal-500/40 rounded-2xl font-semibold text-xl text-white transition-all hover:scale-[1.03] min-h-[64px] backdrop-blur-sm"
              >
                Explore Features
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-12 border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/30 to-emerald-500/20 flex items-center justify-center border border-teal-500/30">
                <Activity size={24} className="text-teal-400" />
              </div>
              <span className="text-xl font-bold gradient-text-teal-amber">VitaChain</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link to="/terms" className="text-slate-400 hover:text-teal-400 transition-colors text-base">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-slate-400 hover:text-teal-400 transition-colors text-base">
                Privacy Policy
              </Link>
              <a href="mailto:nmesirionyengbaronye@gmail.com" className="text-slate-400 hover:text-teal-400 transition-colors text-base">
                Contact Us
              </a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2026 VitaChain. Built with care in Nigeria.</p>
            <p>Proudly built for Hackathons in 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}