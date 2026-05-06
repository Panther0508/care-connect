import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import { ArrowRight, Shield, Brain, Globe2, Heart, Users, Activity, Sparkles, AlertCircle, CheckCircle, QrCode, WifiOff, Lock } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import MagneticButton from "../components/MagneticButton";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function Landing() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate("/dashboard");
    } else {
      navigate("/sign-up");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-slate-100 relative overflow-hidden grain-overlay">
      {/* Animated background glow + floating orbs + parallax */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Primary glow */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px]"
          style={{
            background: 'radial-gradient(circle at center, rgba(20, 184, 166, 0.12) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Secondary glow */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px]"
          style={{
            background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.08) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating ambient orbs */}
        <motion.div
          className="float-orb float-orb-1 w-96 h-96 bg-teal-500/20 top-20 -left-20"
        />
        <motion.div
          className="float-orb float-orb-2 w-80 h-80 bg-cyan-500/15 bottom-40 -right-20"
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 2px, transparent 0)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-30 px-4 py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-slate-900/60 shadow-lg shadow-black/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
            <Heart className="text-white" size={26} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">VitaChain</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/sign-in")}
            className="px-5 py-2.5 text-base text-slate-300 hover:text-white transition-colors font-medium"
          >
            Sign In
          </button>
          <button
            onClick={handleGetStarted}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 rounded-xl font-bold text-base text-white transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 pt-20 pb-32 text-center">
        <ScrollReveal delay={0}>
          {/* Memorial tag */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500/15 to-rose-500/5 border border-rose-500/30 mb-8 backdrop-blur-sm"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse shadow-sm" />
            <span className="text-base text-rose-200 font-medium">In Memory of all those who died of Cancer</span>
          </motion.div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          {/* AI badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium mb-6">
            <Sparkles size={12} />
            AI-Powered Health Intelligence
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight drop-shadow-lg gradient-text-teal-amber">
            VitaChain
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <p className="text-3xl md:text-4xl mb-6 text-slate-200 max-w-4xl mx-auto leading-tight font-medium">
            Your Health, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">Intelligently Managed</span>
          </p>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <p className="text-lg md:text-xl text-slate-400 mb-16 max-w-2xl mx-auto leading-relaxed">
            VitaChain combines clinical-grade health tracking with a personal AI assistant that understands your unique profile.
            <br className="hidden md:block" />
            Take control of your health journey today.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={500}>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <MagneticButton
              className="px-12 py-5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 rounded-2xl font-bold text-xl text-white transition-all shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 min-h-[64px] w-full sm:w-auto flex items-center justify-center gap-3 border border-teal-500/30"
            >
              Start Free
              <ArrowRight size={20} />
            </MagneticButton>
            <MagneticButton
              className="px-12 py-5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 hover:border-teal-500/40 rounded-2xl font-semibold text-xl text-white transition-all hover:shadow-[0_0_30px_rgba(20,184,166,0.2)] min-h-[64px] w-full sm:w-auto flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              Try AI Assistant
            </MagneticButton>
          </div>
        </ScrollReveal>

        {/* Floating feature badges with stagger reveal */}
        <ScrollReveal delay={800}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-3 mt-20"
          >
            {[
              { icon: Brain, label: "AI-Powered Insights" },
              { icon: Shield, label: "End-to-End Encrypted" },
              { icon: Activity, label: "Health Graph Tracking" },
              { icon: Globe2, label: "Multi-Language Support" },
              { icon: Users, label: "Family Profiles" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 12, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-800/70 border border-slate-700/50 text-slate-300 text-base font-medium backdrop-blur-sm hover:border-teal-500/40 transition-colors cursor-default"
              >
                <item.icon size={18} className="text-teal-400" />
                {item.label}
              </motion.div>
            ))}
          </motion.div>
        </ScrollReveal>
      </section>

      {/* Problem / Solution */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
            >
              {/* Problem Side */}
              <motion.div variants={staggerItem}>
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
                    <motion.li
                      key={i}
                      variants={staggerItem}
                      className="flex items-start gap-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/30">
                        <span className="text-rose-400 text-sm font-bold">✕</span>
                      </div>
                      <span className="text-slate-300 text-lg">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Solution Side */}
              <motion.div variants={staggerItem}>
                <GlassCard className="border-l-4 border-l-teal-400 bg-slate-800/40">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/30 to-emerald-500/20 flex items-center justify-center border border-teal-500/30">
                      <CheckCircle size={28} className="text-teal-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-100">Our Solution</h3>
                  </div>
                  <motion.ul
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="space-y-5"
                  >
                    {[
                      { title: 'Personal Health Graph', desc: 'Encrypted, portable health records you control' },
                      { title: 'QR Health Passport', desc: 'Instant access for clinicians with your consent' },
                      { title: 'Mesh Intelligence', desc: 'Community outbreak detection and resource mapping' },
                      { title: 'Offline-First', desc: 'Works without internet, syncs when connectivity returns' },
                    ].map((item, i) => (
                      <motion.li key={i} variants={staggerItem} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5 border border-teal-500/30">
                          <span className="text-teal-400 text-sm font-bold">✓</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 text-lg">{item.title}</div>
                          <div className="text-slate-400 text-base">{item.desc}</div>
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>
                </GlassCard>
              </motion.div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-4 py-20 md:py-28 bg-slate-900/30">
        <ScrollReveal>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-slate-100">
              Why Choose VitaChain?
            </h2>
            <motion.p variants={staggerItem} className="text-xl text-slate-400 text-center mb-16 max-w-2xl mx-auto">
              Powerful features designed for real healthcare challenges
            </motion.p>

            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {[
                { icon: Brain, title: 'Offline AI', desc: 'Gemma 2B medical AI runs on-device', colorFrom: 'from-violet-500', colorTo: 'to-purple-500' },
                { icon: Activity, title: 'Health Graph', desc: 'Track conditions, meds, allergies over time', colorFrom: 'from-emerald-500', colorTo: 'to-teal-500' },
                { icon: QrCode, title: 'QR Passport', desc: 'Share health summary with any clinician', colorFrom: 'from-cyan-500', colorTo: 'to-blue-500' },
                { icon: Globe2, title: '137 Languages', desc: 'Offline-first translation worldwide', colorFrom: 'from-amber-500', colorTo: 'to-orange-500' },
                { icon: Lock, title: 'Privacy First', desc: 'End-to-end encryption, zero-knowledge', colorFrom: 'from-rose-500', colorTo: 'to-red-500' },
                { icon: Shield, title: 'Security', desc: 'Your keys never leave your device', colorFrom: 'from-slate-500', colorTo: 'to-gray-500' },
                { icon: WifiOff, title: 'Offline First', desc: 'Full functionality without internet', colorFrom: 'from-blue-500', colorTo: 'to-indigo-500' },
                { icon: Users, title: 'Family Profiles', desc: 'Guest mode and PIN protection', colorFrom: 'from-teal-500', colorTo: 'to-cyan-500' },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 24, scale: 0.93 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="glass-card p-6 rounded-2xl group relative overflow-hidden tilt-card"
                >
                  <motion.div
                    className="tilt-card-inner"
                    style={{
                      transformStyle: "preserve-3d",
                      transition: "transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.colorFrom}/5 ${feature.colorTo}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.colorFrom} ${feature.colorTo} flex items-center justify-center mb-3 shadow-md group-hover:shadow-lg transition-all relative z-10`}>
                      <feature.icon size={24} className="text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-2 relative z-10">{feature.title}</h3>
                    <p className="text-slate-400 text-base leading-relaxed relative z-10">{feature.desc}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </ScrollReveal>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-4 py-20 md:py-28">
        <ScrollReveal delay={100}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1 },
            }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          >
            <GlassCard className="max-w-4xl mx-auto text-center py-16 bg-gradient-to-br from-teal-900/30 to-cyan-900/20 border-teal-500/20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-100">
                Ready to Take Control of Your Health?
              </h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                Join thousands managing their health with VitaChain's intelligent companion.
              </p>
              <MagneticButton
                className="px-12 py-5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 rounded-2xl font-bold text-xl text-white transition-all shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 min-h-[64px]"
              >
                Get Started Free
              </MagneticButton>
            </GlassCard>
          </motion.div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-12 border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <ScrollReveal>
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/30 to-emerald-500/20 flex items-center justify-center border border-teal-500/30">
                  <Heart size={24} className="text-teal-400" />
                </div>
                <span className="text-xl font-bold gradient-text-teal-amber">VitaChain</span>
              </div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="flex flex-wrap justify-center gap-4 md:gap-6"
              >
                {[
                  { label: "Terms of Service", path: "/terms" },
                  { label: "Privacy Policy", path: "/privacy" },
                  { label: "Contact Us", external: "mailto:nmesirionyengbaronye@gmail.com" },
                ].map((item, idx) => (
                  <motion.button
                    key={idx}
                    variants={staggerItem}
                    whileHover={{ scale: 1.05, color: "#14B8A6" }}
                    className="text-slate-400 hover:text-teal-400 transition-colors text-base"
                  >
                    {item.label}
                  </motion.button>
                ))}
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500"
            >
              <p>© 2026 VitaChain. Built with care in Nigeria.</p>
              <p>Proudly built for Hackathons in 2026</p>
            </motion.div>
          </div>
        </ScrollReveal>
      </footer>
    </div>
  );
}