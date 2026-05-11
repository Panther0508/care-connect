import { useState } from "react";
import { useNavigate } from "react-router-dom";
import VitaAvatar from "../components/VitaAvatar";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Offline: auto-skip if already signed in
  if (isSignedIn) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
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
    // Offline: just save to localStorage for demo purposes
    try {
      localStorage.setItem("offline_password", newPassword);
      setSuccess(true);
    } catch (err) {
      setError("Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Set Password</h1>
          <p className="text-slate-400">Create a password to secure your offline profile.</p>
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
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/30 text-white focus:border-teal-400"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Updating..." : "Save Password"}
            </button>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <VitaAvatar state="success" size={80} />
            </div>
            <p className="text-slate-300">Password saved! You can now sign in.</p>
            <button onClick={() => navigate("/sign-in")} className="btn-primary w-full">
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}