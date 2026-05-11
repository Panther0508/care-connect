import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Sparkles, Heart, Settings, LogOut, Shield, Users, Map, FileText, Bell, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { clearActiveUser } from "../services/healthGraph";
import { useRole } from "../hooks/auth/useRole";

interface SideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Navigation items by role
const NAV_ITEMS: Record<string, { label: string; icon: React.ElementType; route: string }[]> = {
  patient: [
    { label: "Dashboard", icon: Home, route: "/dashboard" },
    { label: "AI Assistant", icon: Sparkles, route: "/ai" },
    { label: "Health", icon: Heart, route: "/health" },
    { label: "Passport", icon: Shield, route: "/passport" },
    { label: "Alerts", icon: Bell, route: "/alerts" },
    { label: "Settings", icon: Settings, route: "/settings" },
  ],
  clinician: [
    { label: "Dashboard", icon: Home, route: "/dashboard" },
    { label: "AI Assistant", icon: Sparkles, route: "/ai" },
    { label: "Health", icon: Heart, route: "/health" },
    { label: "Patient Scan", icon: Users, route: "/clinician-view" },
    { label: "My Profile", icon: Users, route: "/clinician/profile" },
    { label: "Settings", icon: Settings, route: "/settings" },
  ],
  chw: [
    { label: "Dashboard", icon: Home, route: "/dashboard" },
    { label: "Outbreak Map", icon: Map, route: "/outbreak" },
    { label: "Register Need", icon: FileText, route: "/register-need" },
    { label: "Alerts", icon: AlertTriangle, route: "/alerts" },
    { label: "Settings", icon: Settings, route: "/settings" },
  ],
  admin: [
    { label: "Dashboard", icon: Home, route: "/dashboard" },
    { label: "User Mgmt", icon: Users, route: "/admin" },
    { label: "Audit Log", icon: FileText, route: "/audit-log" },
    { label: "Training", icon: Settings, route: "/training" },
    { label: "Evaluation", icon: Settings, route: "/evaluation" },
    { label: "Settings", icon: Settings, route: "/settings" },
  ],
};

export default function SideMenu({ open, onOpenChange }: SideMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, isSignedIn } = useAuth();
  const { role = "patient" } = useRole();
  const menuItems = NAV_ITEMS[role] || NAV_ITEMS.patient;

  const handleNavigation = (route: string) => {
    navigate(route);
    onOpenChange(false);
  };

  const handleSignOut = async () => {
    try {
      if (isSignedIn) {
        await signOut();
      } else {
        localStorage.removeItem("vitachain_session");
        localStorage.removeItem("vitachain_onboarded");
        localStorage.removeItem("user_role");
        localStorage.removeItem("onboarding_completed");
      }
      clearActiveUser();
      navigate("/");
      onOpenChange(false);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Trap focus when open (accessibility)
  useEffect(() => {
    if (open) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onOpenChange(false);
      };
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />

          {/* Side drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-[280px] bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 z-50 flex flex-col shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {/* Vita avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg tracking-tight">VitaChain</h2>
                   <p className="text-base text-slate-300 font-semibold capitalize">{role}</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

             {/* Navigation links with teal scrollbar */}
             <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar" role="navigation" aria-label="Main navigation">
               <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.route;
                  return (
                    <li key={item.route}>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation(item.route)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group border border-transparent ${
                          isActive
                            ? "bg-teal-500/20 border-teal-500/30 text-teal-300"
                            : "hover:bg-white/5 border-white/5 text-slate-300 hover:border-teal-500/30 hover:text-white"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl transition-all group-hover:shadow-glow-primary ${
                            isActive ? "bg-teal-500/20 text-teal-400" : "bg-white/5 text-slate-400 group-hover:text-teal-400"
                          }`}
                        >
                          <Icon size={20} />
                        </div>
                        <span className="flex-1 text-left font-medium text-base">{item.label}</span>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
                        )}
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Sign out at bottom */}
            <div className="p-4 border-t border-white/10">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 transition-all group"
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:text-amber-300 transition-colors">
                  <LogOut size={20} />
                </div>
                <span className="flex-1 text-left text-amber-200 font-medium">Sign Out</span>
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
