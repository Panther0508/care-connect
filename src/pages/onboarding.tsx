import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Onboarding() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }
    // If already completed onboarding, skip to dashboard
    const completed = localStorage.getItem("onboarding_completed");
    if (completed) {
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, navigate]);

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    navigate("/dashboard");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-12 px-4"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Welcome to VitaChain</h1>
          <p className="text-slate-400">Let's set up your health profile in just a few steps</p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-semibold"
            >
              {step}
            </div>
          ))}
        </div>

        {/* Onboarding steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Add Your Health Basics</h2>
          <p className="text-slate-400 text-sm mb-6">
            Enter your key health information to get personalized insights and AI assistance.
          </p>

          {/* Form fields */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Gender</label>
              <select className="glass-input w-full px-4 py-3 text-sm">
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Date of Birth</label>
              <input type="date" className="glass-input w-full px-4 py-3 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Country</label>
              <select className="glass-input w-full px-4 py-3 text-sm">
                <option value="NG">Nigeria</option>
                <option value="KE">Kenya</option>
                <option value="GH">Ghana</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Primary Language</label>
              <select className="glass-input w-full px-4 py-3 text-sm">
                <option value="en">English</option>
                <option value="ha">Hausa</option>
                <option value="yo">Yoruba</option>
                <option value="ig">Igbo</option>
                <option value="sw">Swahili</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="w-full mt-8 px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            Complete Setup
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
