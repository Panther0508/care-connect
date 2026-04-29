import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useRole } from "../hooks/auth/useRole";
import { useAuth } from "@clerk/clerk-react";
import {
  Home,
  Heart,
  Sparkles,
  Bell,
  Settings,
  Scan,
  AlertTriangle,
  Users,
  Shield,
  BarChart3,
  ClipboardList,
  Map,
  LogOut,
  ChevronDown,
  Stethoscope,
  Building2,
  UserPlus
} from "lucide-react";
import { useState } from "react";
import HamburgerDrawer from "./HamburgerDrawer";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
};

// Primary navigation items (always visible)
const PATIENT_NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <Home size={22} strokeWidth={2} />,
    roles: ["patient"],
  },
  {
    to: "/ai",
    label: "AI",
    icon: <Sparkles size={22} strokeWidth={2} />,
    roles: ["patient"],
  },
  {
    to: "/passport",
    label: "Passport",
    icon: <Heart size={22} strokeWidth={2} />,
    roles: ["patient"],
  },
  {
    to: "/alerts",
    label: "Alerts",
    icon: <Bell size={22} strokeWidth={2} />,
    roles: ["patient", "clinician", "chw"],
  },
];

const CLINICIAN_NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <Home size={22} strokeWidth={2} />,
    roles: ["clinician"],
  },
  {
    to: "/clinician-view",
    label: "Scan",
    icon: <Scan size={22} strokeWidth={2} />,
    roles: ["clinician"],
  },
  {
    to: "/ai",
    label: "AI",
    icon: <Sparkles size={22} strokeWidth={2} />,
    roles: ["clinician"],
  },
  {
    to: "/alerts",
    label: "Alerts",
    icon: <Bell size={22} strokeWidth={2} />,
    roles: ["clinician", "chw", "admin"],
  },
];

const CHW_NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <Home size={22} strokeWidth={2} />,
    roles: ["chw"],
  },
  {
    to: "/outbreak",
    label: "Outbreak",
    icon: <AlertTriangle size={22} strokeWidth={2} />,
    roles: ["chw", "admin"],
  },
  {
    to: "/register-need",
    label: "Needs",
    icon: <UserPlus size={22} strokeWidth={2} />,
    roles: ["chw", "patient"],
  },
  {
    to: "/alerts",
    label: "Alerts",
    icon: <Bell size={22} strokeWidth={2} />,
    roles: ["clinician", "chw", "admin"],
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <BarChart3 size={22} strokeWidth={2} />,
    roles: ["admin"],
  },
  {
    to: "/admin",
    label: "Admin",
    icon: <Shield size={22} strokeWidth={2} />,
    roles: ["admin"],
  },
  {
    to: "/audit-log",
    label: "Audit",
    icon: <ClipboardList size={22} strokeWidth={2} />,
    roles: ["admin"],
  },
  {
    to: "/alerts",
    label: "Alerts",
    icon: <Bell size={22} strokeWidth={2} />,
    roles: ["clinician", "chw", "admin"],
  },
];

export default function ModernBottomNav() {
  const { role } = useRole();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getNavItems = (): NavItem[] => {
    if (!role) return PATIENT_NAV;

    switch (role) {
      case "patient":
        return PATIENT_NAV;
      case "clinician":
        return CLINICIAN_NAV;
      case "chw":
        return CHW_NAV;
      case "admin":
        return ADMIN_NAV;
      default:
        return PATIENT_NAV;
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Modern Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-slate-900/70 backdrop-blur-xl border-t border-white/5 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          <ul className="flex items-center justify-around h-16">
            {navItems.map(({ to, label, icon }) => (
              <li key={to} className="flex-1 h-full">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center h-full gap-1 transition-all duration-200 relative ${
                      isActive ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <motion.div
                        className="h-6 w-6"
                        animate={
                          isActive
                            ? {
                                y: [0, -3, 0],
                                scale: [1, 1.1, 1],
                              }
                            : {}
                        }
                        transition={{ duration: 0.3 }}
                      >
                        {icon}
                      </motion.div>
                      <span className="text-[10px] font-medium leading-none tracking-tight">
                        {label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute -top-0.5 w-12 h-0.5 bg-teal-400 rounded-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
            {/* Hamburger "More" Button */}
            <li className="flex-1 h-full">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex flex-col items-center justify-center h-full gap-1 transition-all duration-200 text-slate-500 hover:text-slate-300"
                aria-label="Open menu"
              >
                <motion.div
                  className="h-6 w-6"
                  animate={{ rotate: drawerOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Hamburger icon (3 lines) */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </motion.div>
                <span className="text-[10px] font-medium leading-none tracking-tight">More</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hamburger Drawer */}
      <HamburgerDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
