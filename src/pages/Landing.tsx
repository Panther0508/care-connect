import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import { ArrowRight, Shield, Brain, Globe2, Heart, Users, Activity, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden"
      >
        {/* Background accent glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <header className="relative z-10 px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center">
              <Heart className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-white">VitaChain</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/sign-in")}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors font-medium"
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl font-semibold text-white transition-colors"
            >
              Get Started
            </button>
          </div>
        </header>

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium mb-6">
              <Sparkles size={12} />
              AI-Powered Health Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Your Health,
              <br />
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Intelligently Managed</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              VitaChain combines clinical-grade health tracking with a personal AI assistant that understands your unique profile. Take control of your health journey today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-teal-600 hover:bg-teal-500 rounded-2xl font-semibold text-white transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25"
              >
                Start Free
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate("/ai")}
                className="px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-teal-500/30 rounded-2xl font-semibold text-white transition-all flex items-center justify-center gap-2"
              >
                Try AI Assistant
              </button>
            </div>
          </motion.div>

          {/* Floating feature badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-4 mt-16"
          >
            {[
              { icon: Brain, label: "AI-Powered Insights" },
              { icon: Shield, label: "End-to-End Encrypted" },
              { icon: Activity, label: "Health Graph Tracking" },
              { icon: Globe2, label: "Multi-Language Support" },
              { icon: Users, label: "Family Profiles" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/30 text-slate-300 text-xs"
              >
                <item.icon size={14} className="text-teal-400" />
                {item.label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Decorative gradient waves */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </motion.div>

      {/* Features section */}
      <section className="relative z-10 px-4 py-20 -mt-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Why VitaChain?</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Personal AI Assistant",
                description: "Ask questions about your health records, get medication interaction checks, and receive plain-language explanations powered by state-of-the-art language models.",
                icon: Brain,
                color: "from-teal-500 to-cyan-500",
              },
              {
                title: "Health Graph",
                description: "Visualise your health journey with interactive charts tracking conditions, medications, allergies, vitals, and care gaps over time.",
                icon: Activity,
                color: "from-amber-500 to-orange-500",
              },
              {
                title: "Family Privacy",
                description: "Guest mode and PIN protection keep sensitive health data private on shared devices, crucial for multi-user households.",
                icon: Shield,
                color: "from-emerald-500 to-green-500",
              },
              {
                title: "Voice Interaction",
                description: "Voice-only mode allows illiterate users or those who cannot read to interact naturally using speech-to-text and text-to-speech.",
                icon: Globe2,
                color: "from-blue-500 to-indigo-500",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-5"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-3`}>
                  <feature.icon className="text-white" size={20} />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-action */}
      <section className="relative z-10 px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Ready to take control of your health?</h2>
          <p className="text-slate-400 mb-8">
            Join thousands managing their health with VitaChain's intelligent companion.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-teal-600 hover:bg-teal-500 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] shadow-lg shadow-teal-500/25"
          >
            Get Started Free
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-4 text-center text-slate-500 text-xs">
        <p>© 2026 VitaChain. Built with care in Nigeria.</p>
      </footer>
    </div>
  );
}
