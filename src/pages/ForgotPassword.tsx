import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import VitaAvatar from "../components/VitaAvatar";

export default function ForgotPassword() {
  const { signIn } = useSignIn();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await signIn?.forgotPassword({ emailAddress: email });
      setSubmitted(true);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to send reset email");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Forgot Your Password?</h1>
          <p className="text-slate-400">Enter your email and we'll send you a reset link.</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-white focus:border-teal-400"
              required
            />
            <button type="submit" className="btn-primary w-full">
              Send Reset Link
            </button>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <VitaAvatar state="success" size={80} />
            </div>
            <p className="text-slate-300">
              If an account exists with that email, a reset link has been sent. Please check your inbox and spam folder.
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
