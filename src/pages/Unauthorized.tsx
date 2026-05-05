import { useNavigate } from "react-router-dom";
import { useRole } from "../hooks/auth/useRole";
import VitaAvatar from "../components/VitaAvatar";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { role } = useRole();

  const getDashboardForRole = () => {
    switch (role) {
      case "patient":
        return "/health";
      case "clinician":
        return "/clinician-view";
      case "chw":
        return "/outbreak";
      case "admin":
        return "/admin";
      default:
        return "/dashboard";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <VitaAvatar state="error" size={80} />
        </div>
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-slate-400">
          You do not have the required permissions to view this page.
        </p>
        <button onClick={() => navigate(getDashboardForRole())} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
