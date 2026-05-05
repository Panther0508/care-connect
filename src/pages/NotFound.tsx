import { useNavigate } from "react-router-dom";
import VitaAvatar from "../components/VitaAvatar";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <VitaAvatar state="empty" size={80} />
        </div>
        <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
        <p className="text-slate-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button onClick={() => navigate("/dashboard")} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
