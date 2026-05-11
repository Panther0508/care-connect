import { useState } from "react";
import { useNavigate } from "react-router-dom";
import VitaAvatar from "../components/VitaAvatar";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [sent, setSent] = useState(false);

  // Offline: auto-skip verification if signed in
  if (isSignedIn) {
    navigate("/dashboard");
    return null;
  }

  const handleContinue = () => {
    navigate("/sign-in");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full space-y-4 text-center">
        <div className="flex justify-center">
          <VitaAvatar state="default" size={80} />
        </div>
        <h1 className="text-2xl font-bold text-white">Offline Mode</h1>
        <p className="text-slate-400">
          VitaChain works completely offline without email verification.
          Your health data stays on your device.
        </p>

        <button onClick={handleContinue} className="btn-primary">
          Continue to Sign In
        </button>
      </div>
    </div>
  );
}