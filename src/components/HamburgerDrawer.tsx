import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Settings,
  CreditCard,
  Gift,
  HelpCircle,
  Globe,
  LogOut,
  Shield,
  Building2,
  Users,
  FileText,
  Map,
  Activity,
  Trophy,
  Target,
  MessagesSquare,
  BookOpen,
  MapPin,
  Moon,
  Mail
} from "lucide-react";
import { useState } from "react";
import { clearActiveUser } from "../services/healthGraph";

interface HamburgerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Secondary menu items (shown in drawer)
const SECONDARY_ITEMS = [
  { label: "Settings", icon: Settings, route: "/settings", roles: ["patient", "clinician", "chw", "admin"] },
  { label: "Subscription", icon: CreditCard, route: "/subscription", roles: ["patient", "clinician", "chw", "admin"] },
  { label: "Referral", icon: Gift, route: "/referral", roles: ["patient", "clinician", "chw", "admin"] },
  { label: "Support", icon: HelpCircle, route: "/support", roles: ["patient", "clinician", "chw", "admin"] },
  { label: "Terms", icon: FileText, route: "/terms", roles: ["patient", "clinician", "chw", "admin"] },
  { label: "Privacy", icon: Shield, route: "/privacy", roles: ["patient", "clinician", "chw", "admin"] },
  { label: "Contact", icon: Mail, route: "/contact", roles: ["patient", "clinician", "chw", "admin"] },
  { label: "Language", icon: Globe, route: "/language", roles: ["patient", "clinician", "chw", "admin"] },
  // New features for patient engagement
  { label: "Rewards", icon: Trophy, route: "/rewards", roles: ["patient"] },
  { label: "Avatar", icon: Moon, route: "/avatar", roles: ["patient"] }, // Added Avatar Customization
  { label: "Quests", icon: Target, route: "/quests", roles: ["patient"] },
  { label: "Community", icon: MessagesSquare, route: "/community", roles: ["patient"] },
  { label: "Education", icon: BookOpen, route: "/education", roles: ["patient"] },
  { label: "Care Locator", icon: MapPin, route: "/care-locator", roles: ["patient"] },
];

// Role-specific shortcuts
const ROLE_SHORTCUTS: Record<string, { label: string; icon: React.ElementType; route: string; roles: string[] }[]> = {
  patient: [
    { label: "Health Graph", icon: Activity, route: "/health", roles: ["patient", "clinician", "chw"] },
    { label: "Passport", icon: Shield, route: "/passport", roles: ["patient", "chw"] },
  ],
   clinician: [
     { label: "Patient Scan", icon: Building2, route: "/clinician-view", roles: ["clinician"] },
     { label: "My Profile", icon: Users, route: "/clinician/profile", roles: ["clinician"] },
   ],
  chw: [
    { label: "Outbreak Map", icon: Map, route: "/outbreak", roles: ["chw", "admin"] },
    { label: "Register Need", icon: FileText, route: "/register-need", roles: ["chw", "patient"] },
  ],
  admin: [
    { label: "User Mgmt", icon: Users, route: "/admin", roles: ["admin"] },
    { label: "Audit Log", icon: FileText, route: "/audit-log", roles: ["admin"] },
  ],
};

export default function HamburgerDrawer({ open, onOpenChange }: HamburgerDrawerProps) {
  const { signOut, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      if (isSignedIn) {
        await signOut();
      } else {
        // Offline fallback: clear local storage
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
    } finally {
      setSigningOut(false);
      setShowConfirm(false);
    }
  };

   // Build menu items based on role
   // We'll defer role check until drawer opens (role is read from localStorage synchronously)
   const getMenuItems = () => {
     const role = localStorage.getItem("user_role") || "patient";
     const shortcuts = ROLE_SHORTCUTS[role] || ROLE_SHORTCUTS.patient;
     // Filter secondary items to only those accessible by the current role
     const filteredSecondary = SECONDARY_ITEMS.filter(item => item.roles.includes(role));
     return [...shortcuts, ...filteredSecondary];
   };

  const menuItems = getMenuItems();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
         <SheetContent
           side="bottom"
           className="h-[70vh] bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl"
         >
           <SheetHeader className="text-center">
             <SheetTitle className="text-white text-lg font-semibold">Menu</SheetTitle>
           </SheetHeader>

           <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2" role="navigation" aria-label="Menu navigation">
           {/* Role shortcuts first */}
           {menuItems.map((item) => {
             const Icon = item.icon;
             return (
               <motion.button
                 key={item.route}
                 whileTap={{ scale: 0.95 }}
                 whileHover={{ scale: 1.02 }}
                 onClick={() => {
                   navigate(item.route);
                   onOpenChange(false);
                 }}
                 className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-teal-500/30 transition-all group"
               >
                 <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 group-hover:text-teal-300 transition-colors group-hover:shadow-glow-primary">
                   <Icon size={20} />
                 </div>
                 <span className="flex-1 text-left text-white font-medium">{item.label}</span>
                 <svg
                   className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors"
                   fill="none"
                   viewBox="0 0 24 24"
                   stroke="currentColor"
                 >
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
               </motion.button>
             );
           })}
             </nav>

          {/* Sign Out Button */}
           <motion.button
             whileTap={{ scale: 0.95 }}
             whileHover={{ scale: 1.02 }}
             onClick={() => setShowConfirm(true)}
             disabled={signingOut}
             className="w-full flex items-center gap-4 p-4 mt-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 transition-all group"
           >
             <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:text-amber-300 transition-colors">
               <LogOut size={20} />
             </div>
             <span className="flex-1 text-left text-amber-200 font-medium">
               {signingOut ? "Signing out..." : "Sign Out"}
             </span>
           </motion.button>

         {/* Drag handle at top (already in SheetContent) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full" />
      </SheetContent>

      {/* Sign Out Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-[90%] shadow-2xl"
          >
            <h3 className="text-white text-lg font-semibold mb-2">Confirm Sign Out</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to sign out? You will need to sign in again to access your health data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex-1 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors disabled:opacity-50"
              >
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </motion.div>
        </div>
          )}
    </Sheet>
  );
}
