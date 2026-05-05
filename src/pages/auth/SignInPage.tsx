import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth, SignIn } from "@clerk/clerk-react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function SignInPage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  if (isSignedIn) {
    navigate("/dashboard");
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
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-slate-400 mt-2">Sign in to continue to VitaChain</p>
        </div>

        <div className="glass-card p-6">
          <SignIn
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
          <p className="text-center text-xs text-slate-400 mt-4">
            Forgot your password?{' '}
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-teal-400 hover:underline"
            >
              Reset it
            </button>
          </p>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => navigate("/sign-up")}
            className="text-teal-400 hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </motion.div>
    </div>
  );
}
