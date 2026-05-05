import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import VitaAvatar from "../components/VitaAvatar";

export default function ResetPassword() {
  const { signIn } = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();
  const code = new URLSearchParams(location.search).get("code");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) {
      setError("Missing reset code. Please use the link from your email.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Use the signIn resource to reset password with the code
      await signIn?.resetPassword({ code, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Failed to reset password. The code may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
          <p className="text-slate-400">Enter your new password below.</p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-input w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-white focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-white focus:border-teal-400"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Updating..." : "Update Password"}
            </button>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <VitaAvatar state="success" size={80} />
            </div>
            <p className="text-slate-300">Your password has been reset. You can now sign in.</p>
            <button onClick={() => navigate("/sign-in")} className="btn-primary w-full">
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
