import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useStatus } from "../hooks/useStatus";
import { ROLE_INFO, ROLES, type UserRole } from "../lib/roles";

export default function Onboarding() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const { showStatus } = useStatus();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("NG");
  const [language, setLanguage] = useState("en");

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
    if (!selectedRole) {
      showStatus('error', 'Role Required', 'Please select a role to continue');
      return;
    }
    // Store role and completion flag
    localStorage.setItem("user_role", selectedRole);
    localStorage.setItem("user_gender", gender);
    localStorage.setItem("user_dob", dob);
    localStorage.setItem("user_country", country);
    localStorage.setItem("user_language", language);
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
           <h2 className="text-xl font-semibold text-white mb-4">Select Your Role</h2>
           <p className="text-slate-400 text-sm mb-6">
             Choose the role that best describes how you'll use VitaChain.
           </p>

           {/* Role selection cards */}
           <div className="grid grid-cols-2 gap-3 mb-8">
             {(Object.values(ROLES) as UserRole[]).map(role => {
               const info = ROLE_INFO[role];
               const isSelected = selectedRole === role;
               return (
                 <button
                   key={role}
                   onClick={() => {
                     setSelectedRole(role);
                     showStatus('success', 'Role Selected', `${info.label} role chosen`);
                   }}
                   className={`p-4 rounded-xl border text-left transition-all ${
                     isSelected
                       ? 'bg-teal-500/20 border-teal-500/40 text-teal-100'
                       : 'bg-slate-800/50 border-slate-700/30 text-slate-300 hover:border-teal-500/30'
                   }`}
                 >
                   <div className="text-2xl mb-2">{info.icon}</div>
                   <div className="font-medium mb-1">{info.label}</div>
                   <div className="text-xs text-slate-400 line-clamp-2">{info.description}</div>
                   {isSelected && (
                     <div className="mt-2 flex items-center text-teal-400 text-sm">
                       <Check size={14} className="mr-1" /> Selected
                     </div>
                   )}
                 </button>
               );
             })}
           </div>

           <h2 className="text-xl font-semibold text-white mb-4">Health Basics</h2>
           <p className="text-slate-400 text-sm mb-6">
             Enter your key health information to get personalized insights and AI assistance.
           </p>

          {/* Form fields */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Gender</label>
              <select className="glass-input w-full px-4 py-3 text-sm" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Date of Birth</label>
              <input type="date" className="glass-input w-full px-4 py-3 text-sm" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Country</label>
              <select className="glass-input w-full px-4 py-3 text-sm" value={country} onChange={(e) => setCountry(e.target.value)}>
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
              <select className="glass-input w-full px-4 py-3 text-sm" value={language} onChange={(e) => setLanguage(e.target.value)}>
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
