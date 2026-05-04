import { NavLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useRole } from "../hooks/auth/useRole";
import { useAuth } from "@clerk/clerk-react";
import {
  Home,
  Sparkles,
  Apple,
  Dumbbell,
  Bell,
  AlertTriangle,
  Users,
  Shield,
  BarChart3,
  Map,
  LogOut,
  ChevronDown,
  Stethoscope,
  Building2,
  UserPlus,
  Moon,
  Droplets,
  Pill,
  Calculator,
  Brain,
  FirstAidKit,
  Scan,
  Heart,
  Settings,
  FilePlus,
  BookOpen,
  Share2,
} from "lucide-react";
import { useState } from "react";
import HamburgerDrawer from "./HamburgerDrawer";

// Navigation item type
interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number; strokeLinecap?: string; strokeLinejoin?: string }>;
}

// Patient navigation items
const PATIENT_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/ai", label: "AI", icon: Sparkles },
  { to: "/nutrition", label: "Nutrition", icon: Apple },
  { to: "/workout", label: "Workout", icon: Dumbbell },
  { to: "/passport", label: "Passport", icon: Scan },
];

// Clinician navigation items
const CLINICIAN_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/ai", label: "AI", icon: Sparkles },
  { to: "/health", label: "Health", icon: Heart },
  { to: "/clinician/profile", label: "Profile", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

// CHW navigation items
const CHW_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/outbreak", label: "Outbreak", icon: Map },
  { to: "/register-need", label: "Needs", icon: FilePlus },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/settings", label: "Settings", icon: Settings },
];

// Admin navigation items
const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: Home },
  { to: "/audit-log", label: "Audit", icon: FilePlus },
  { to: "/training", label: "Training", icon: BookOpen },
  { to: "/evaluation", label: "Evaluation", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function ModernBottomNav() {
  const { role } = useRole();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isReducedMotion = useReducedMotion();

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
       {/* Modern Bottom Navigation Bar - Pill Design */}
       <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 h-14 bg-[rgba(30,41,59,0.85)] backdrop-blur-[20px] border border-white/10 rounded-full shadow-lg">
         <ul className="flex items-center justify-around h-full px-2 gap-1">
           {navItems.map(({ to, label, icon: Icon }) => (
             <li key={to} className="flex-1 flex justify-center h-full">
               <NavLink
                 to={to}
                 className={({ isActive }) =>
                   `flex flex-col items-center justify-center h-full gap-1 transition-all duration-300 relative ${
                     isActive
                       ? "text-teal-400"
                       : "text-slate-500 hover:text-slate-300"
                   }`
                 }
                 aria-label={label}
               >
                 {({ isActive }) => (
                   <>
                     <motion.div
                       className="flex-shrink-0"
                       animate={{
                         scale: isActive ? [0.95, 1.15, 1] : 1,
                         y: isActive ? [-2, 2, 0] : 0,
                       }}
                       transition={{
                         type: isReducedMotion ? false : "spring",
                         duration: 0.3,
                         bounce: 0.2,
                       }}
                     >
                       <Icon size={18} />
                     </motion.div>
                     <span className="text-[10px] font-medium leading-none tracking-tight">
                       {label}
                     </span>
                     {isActive && (
                       <>
                         <motion.div
                           layoutId="activeIndicator"
                           className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-teal-400"
                           initial={false}
                           transition={{ type: isReducedMotion ? false : "spring", stiffness: 500, damping: 30 }}
                         />
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-teal-400/20 animate-pulse-glow pointer-events-none" />
                       </>
                     )}
                   </>
                 )}
               </NavLink>
             </li>
           ))}
           {/* Hamburger "More" Button */}
           <li className="flex-1 flex justify-center">
             <button
               onClick={() => setDrawerOpen(true)}
               className="flex flex-col items-center justify-center h-full gap-1 transition-all duration-300 text-slate-500 hover:text-slate-300"
               aria-label="Open menu"
             >
               <motion.div
                 className="flex-shrink-0"
                 animate={{
                   rotate: drawerOpen ? [0, 90, 0] : [0, 0, 0],
                 }}
                 transition={{
                   type: isReducedMotion ? false : "spring",
                   duration: 0.3,
                 }}
               >
                 {/* Hamburger icon (3 lines) */}
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                   <line x1="3" y1="6" x2="21" y2="6" />
                   <line x1="3" y1="12" x2="21" y2="12" />
                   <line x1="3" y1="18" x2="21" y2="18" />
                 </svg>
               </motion.div>
               <span className="text-[10px] font-medium leading-none tracking-tight">More</span>
             </button>
           </li>
         </ul>
       </nav>

       {/* Hamburger Drawer */}
       <HamburgerDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      </>
    );
  }
