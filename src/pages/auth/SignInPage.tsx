import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BiometricButton from "../../components/BiometricButton";

export default function SignInPage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [biometricError, setBiometricError] = useState("");

  if (isSignedIn) {
    navigate("/dashboard");
    return null;
  }

  const handleBiometricSuccess = () => {
    // For demo: if biometric verifies, we simulate a signed-in state
    // In production, this would trigger Clerk's sign-in via custom token
    setBiometricError("");
    // Optionally: navigate to dashboard or show success message
    navigate("/dashboard");
  };

  const handleBiometricError = (error: string) => {
    setBiometricError(error);
  };

  const handleRegisterBiometric = () => {
    setBiometricError("Please log in first, then enable biometrics in Settings.");
  };

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
          <button
            onClick={() => navigate("/onboarding")}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-medium"
          >
            Get Started
          </button>
        </div>

        <div className="mt-6">
          <BiometricButton
            onSuccess={handleBiometricSuccess}
            onError={handleBiometricError}
            onRegisterRequired={handleRegisterBiometric}
          />
          {biometricError && <p className="text-rose-400 text-xs text-center mt-2">{biometricError}</p>}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          New to VitaChain?{' '}
          <button
            onClick={() => navigate("/sign-up")}
            className="text-teal-400 hover:underline"
          >
            Create an account
          </button>
        </p>
      </motion.div>
    </div>
  );
}
