import { useState } from "react";
import { useNavigate } from "react-router-dom";
import VitaAvatar from "../components/VitaAvatar";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Offline: auto-skip if already signed in
  if (isSignedIn) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Offline: just show success message
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Offline Mode</h1>
          <p className="text-slate-400">VitaChain works offline without email password reset.</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-slate-300">
              Your health data is stored locally on your device. To reset your offline profile,
              simply sign in again with a different name.
            </p>
            <button type="submit" className="btn-primary w-full">
              Continue
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <VitaAvatar state="success" size={80} />
            </div>
            <p className="text-slate-300">
              No email reset needed for offline mode. Go to Sign In to continue.
            </p>
          </div>
        )}

        <p className="text-center">
          <button onClick={() => navigate("/sign-in")} className="text-teal-400 hover:underline text-sm">
            Back to Sign In
          </button>
        </p>
      </div>
    </div>
  );
}