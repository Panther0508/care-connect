import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useRef } from "react";
import { ArrowRight, Shield, Brain, Globe2, Heart, Users, Activity, Sparkles, AlertCircle, CheckCircle, QrCode, WifiOff, Lock, Zap, ShieldCheck, Database } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import MagneticButton from "../components/MagneticButton";
import GlassCard from "../components/GlassCard";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
};

export default function Landing() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate("/dashboard");
    } else {
      navigate("/sign-up");
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0F172A] text-slate-100 relative overflow-hidden grain-overlay">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute inset-0"
        >
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
          <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-cyan-500/5 blur-[100px] rounded-full" />
        </motion.div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-6 py-4 backdrop-blur-xl border-b border-white/5 bg-slate-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Heart className="text-white" size={22} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">VitaChain</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/sign-in")} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</button>
            <button onClick={handleGetStarted} className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-bold transition-all">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-24 pb-32 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold tracking-widest uppercase mb-8">
            <Sparkles size={14} />
            Next-Generation Health OS
          </div>
          <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9]">
            Your Health,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Decentralized.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            VitaChain is a clinical-grade health platform that puts your medical data in your control. 
            Works completely offline, respects your privacy, and leverages on-device AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <MagneticButton onClick={handleGetStarted} className="px-10 py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-lg font-bold shadow-lg shadow-teal-900/20 flex items-center gap-2">
              Launch App
              <ArrowRight size={20} />
            </MagneticButton>
            <button className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-lg font-semibold transition-all">
              View Demo
            </button>
          </div>
        </motion.div>

        {/* Stats / Trust Badges */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-24"
        >
          {[
            { icon: ShieldCheck, label: "Self-Sovereign", sub: "Data Ownership" },
            { icon: WifiOff, label: "Offline-First", sub: "Works Anywhere" },
            { icon: Brain, label: "On-Device AI", sub: "Privacy Focused" },
            { icon: Database, label: "Health Graph", sub: "Unified Records" },
          ].map((stat, i) => (
            <motion.div key={i} variants={staggerItem} className="bg-slate-800/50 border border-white/5 p-6 text-center rounded-2xl backdrop-blur-md">
              <stat.icon className="text-teal-400 mx-auto mb-3" size={28} />
              <div className="font-bold text-white">{stat.label}</div>
              <div className="text-xs text-slate-500 font-medium">{stat.sub}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 px-6 py-32 bg-slate-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Designed for clinical reliability and ultimate patient privacy.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: QrCode, title: "Health Passport", desc: "Securely share your health summary with any clinician via encrypted QR codes, no internet needed.", color: "text-teal-400", bg: "bg-teal-500/10" },
              { icon: Activity, title: "Real-time Monitoring", desc: "Track chronic conditions, medications, and vital signs with clinical-grade precision.", color: "text-cyan-400", bg: "bg-cyan-500/10" },
              { icon: Globe2, title: "Global Accessibility", desc: "Built-in support for 137+ languages with offline-first translation for inclusive care.", color: "text-indigo-400", bg: "bg-indigo-500/10" },
              { icon: Zap, title: "On-Device AI", desc: "Get medical insights and triage advice from a 31B parameter model running right on your phone.", color: "text-amber-400", bg: "bg-amber-500/10" },
              { icon: Lock, title: "Zero-Knowledge", desc: "Your data is encrypted with your own keys. Even we can't see your medical history.", color: "text-rose-400", bg: "bg-rose-500/10" },
              { icon: Users, title: "Family Care", desc: "Manage multiple profiles for children or elderly relatives with secure guest mode.", color: "text-emerald-400", bg: "bg-emerald-500/10" }
            ].map((f, i) => (
              <GlassCard key={i} className="group p-8">
                <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon className={f.color} size={30} />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="relative z-10 px-6 py-32 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/20 mb-10">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">Hackathon Edition</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-8">In Memory of all those who lost their lives to preventable illness.</h2>
        <p className="text-slate-400 text-lg mb-12">VitaChain is built to ensure that medical history is never the barrier to life-saving care.</p>
        <div className="flex justify-center gap-8 grayscale opacity-50">
          <div className="font-black text-2xl tracking-tighter">WHO</div>
          <div className="font-black text-2xl tracking-tighter">UNICEF</div>
          <div className="font-black text-2xl tracking-tighter">MSF</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-20 border-t border-white/5 bg-slate-900/80">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                <Heart className="text-white" size={18} fill="currentColor" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">VitaChain</span>
            </div>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              Empowering individuals with clinical-grade health intelligence and self-sovereign data ownership.
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-6">
            <div className="flex gap-8 text-sm font-medium text-slate-400">
              <button className="hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-white transition-colors">Terms</button>
              <button className="hover:text-white transition-colors">Security</button>
            </div>
            <p className="text-slate-600 text-xs">
              © 2026 VitaChain. Built for the future of healthcare.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}