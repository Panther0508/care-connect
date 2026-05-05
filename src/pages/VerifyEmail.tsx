import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import VitaAvatar from "../components/VitaAvatar";

export default function VerifyEmail() {
  const { signUp } = useSignUp();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    try {
      await signUp?.resendVerificationEmail();
      setSent(true);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to resend verification email");
    }
  };

  const email = signUp?.emailAddress || "your email";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full space-y-4 text-center">
        <div className="flex justify-center">
          <VitaAvatar state="default" size={80} />
        </div>
        <h1 className="text-2xl font-bold text-white">Check Your Email!</h1>
        <p className="text-slate-400">
          We've sent a verification link to{" "}
          <span className="text-teal-300">{email}</span>. Click the link to activate your account.
        </p>

        {!sent ? (
          <button onClick={handleResend} className="btn-primary">
            Resend Verification Email
          </button>
        ) : (
          <p className="text-teal-400 text-sm">Verification email sent! Check your inbox (and spam).</p>
        )}

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        <p className="text-sm">
          <button onClick={() => navigate("/sign-in")} className="text-teal-400 hover:underline">
            Back to Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
