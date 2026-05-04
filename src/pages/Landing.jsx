import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-teal-950 text-white">
      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-300">
            VitaChain
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Your Health, Your Guardian
          </p>
          <p className="text-base md:text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
            The first decentralized health platform that puts your medical data in your control.
            Works offline. Respects your privacy. Saves lives.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/sign-up"
              className="px-8 py-4 bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-teal-500/30"
            >
              Get Started Free
            </Link>
            <Link
              to="/sign-in"
              className="px-8 py-4 border-2 border-teal-500/50 hover:border-teal-400 rounded-lg font-semibold text-lg transition-all hover:bg-teal-900/30"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Problem / Solution */}
      <section className="px-4 py-16 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">The Problem</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                In emergency situations, every second counts. But medical history is scattered across
                clinics, hospitals, and paper records. Patients can't access their own data when
                they need it most.
              </p>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-red-400">✕</span>
                  <span>87% of deaths in emergencies occur before reaching hospital</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400">✕</span>
                  <span>Medical records are siloed and inaccessible</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400">✕</span>
                  <span>Rural communities have no reliable health infrastructure</span>
                </li>
              </ul>
            </div>
            <div className="bg-slate-900/50 p-8 rounded-xl border border-slate-700">
              <h3 className="text-2xl font-bold mb-4 text-teal-400">Our Solution</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">Personal Health Graph</div>
                    <div className="text-sm text-slate-400">Encrypted, portable health records you control</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">QR Health Passport</div>
                    <div className="text-sm text-slate-400">Instant access for clinicians with your consent</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">Mesh Intelligence</div>
                    <div className="text-sm text-slate-400">Community outbreak detection and resource mapping</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">Offline-First</div>
                    <div className="text-sm text-slate-400">Works without internet, syncs when connectivity returns</div>
                  </div>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Built for Real Healthcare Challenges
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Health Graph',
              desc: 'Automerge CRDT keeps your health history synchronized across all devices',
              icon: '📊',
            },
            {
              title: 'Offline AI',
              desc: 'Gemma 2B medical AI runs on-device for symptom checking, even without internet',
              icon: '🤖',
            },
            {
              title: 'QR Passport',
              desc: 'Verifiable credentials share with any clinician via QR scan',
              icon: '📱',
            },
            {
              title: 'Mesh Network',
              desc: 'Bluetooth and satellite gossip protocol for community health intelligence',
              icon: '🌐',
            },
            {
              title: '137 Languages',
              desc: 'Offline-first translation for rural communities worldwide',
              icon: '🌍',
            },
            {
              title: 'Privacy First',
              desc: 'End-to-end encryption, zero-knowledge architecture, you own your data',
              icon: '🔐',
            },
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-800/40 p-6 rounded-xl border border-slate-700 hover:border-teal-500/50 transition-colors"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="px-4 py-16 bg-slate-800/30">
        <h2 className="text-3xl font-bold text-center mb-12">What Users Say</h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {[
            {
              name: 'Dr. Amara, Lagos',
              text: 'VitaChain changed how we deliver care in rural Nigeria. Patients can finally access their full history.',
            },
            {
              name: 'James, Nairobi',
              text: 'I was in an accident and my medical history was instantly available to the ER doctors. Lifesaving.',
            },
          ].map((t, i) => (
            <blockquote key={i} className="bg-slate-900/40 p-6 rounded-xl border-l-4 border-teal-500">
              <p className="text-slate-300 italic mb-4">"{t.text}"</p>
              <footer className="text-teal-400 font-semibold">— {t.name}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              q: 'Is my health data secure?',
              a: 'Yes. All data is encrypted end-to-end with AES-256-GCM. Your encryption keys never leave your device. Not even we can access your records.',
            },
            {
              q: 'How does offline mode work?',
              a: 'The app caches your health records, AI models, and translations locally. You can view, update, and share health data without any internet connection. Changes sync automatically when connectivity returns.',
            },
            {
              q: 'Can I delete my data?',
              a: 'Absolutely. Under the Nigeria Data Protection Act, you have the right to erasure. One tap deletes all local data and requests deletion from our servers.',
            },
            {
              q: 'Is this suitable for rural areas?',
              a: 'Yes. Designed for low-connectivity environments. Works with Bluetooth mesh, supports local languages offline, and requires minimal data usage.',
            },
          ].map((faq, i) => (
            <details key={i} className="bg-slate-800/40 rounded-lg p-4 group">
              <summary className="font-semibold cursor-pointer text-teal-300">{faq.q}</summary>
              <p className="mt-3 text-slate-400 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 border-t border-[rgba(148,163,184,0.12)] bg-[rgba(30,41,59,0.65)] backdrop-blur-[20px] text-center">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
            <Link to="/terms" className="text-slate-400 hover:text-teal-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-slate-400 hover:text-teal-400 transition-colors">
              Privacy Policy
            </Link>
            <a href="mailto:support@vitachain.health" className="text-slate-400 hover:text-teal-400 transition-colors">
              Contact Us
            </a>
          </div>
          <p className="text-slate-500 text-sm">
            Proudly built for the Abuja Innovation Challenge 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
