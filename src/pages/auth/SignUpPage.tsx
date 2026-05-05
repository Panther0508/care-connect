import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth, SignUp } from "@clerk/clerk-react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check } from "lucide-react";

export default function SignUpPage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  if (isSignedIn) {
    navigate("/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center mx-auto mb-4">
            <svg className="text-white" size={28} viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-2">Start your health journey with VitaChain</p>
        </div>

        <div className="glass-card p-6">
          <SignUp
            afterSignUpUrl="/verify-email"
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-transparent shadow-none",
                header: "hidden",
                footer: "hidden",
                formButtonPrimary: "bg-teal-600 hover:bg-teal-500 text-white rounded-xl",
                formFieldInput:
                  "glass-input w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-white focus:border-teal-400",
              },
            }}
          />
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <button
            onClick={() => navigate("/sign-in")}
            className="text-teal-400 hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
}
