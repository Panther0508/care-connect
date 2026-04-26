import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const NAV = [
  { 
    to: "/", 
    label: "Search", 
    end: true,
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  },
  { 
    to: "/alerts", 
    label: "Alerts",
    hasBadge: true,
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
    )
  },
  { 
    to: "/reservation/1", 
    label: "Reservation",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/>
      </svg>
    )
  },
  { 
    to: "/register-need", 
    label: "Register",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>
      </svg>
    )
  },
  { 
    to: "/impact", 
    label: "Impact",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>
      </svg>
    )
  },
];

export function BottomNav() {
  return (
    <motion.nav 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
      className="fixed bottom-0 inset-x-0 h-16 bg-slate-900/80 backdrop-blur-lg border-t border-slate-800/50 z-40"
    >
      <ul className="flex items-center justify-around h-full">
        {NAV.map(({ to, label, svg, end, hasBadge }) => (
          <li key={to} className="flex-1 h-full">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full gap-1 transition-all duration-200 ${
                  isActive ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div 
                    className="h-6 w-6 relative"
                    animate={isActive ? { y: [0, -4, 0] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {svg}
                    {hasBadge && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-slate-900 rounded-full" />
                    )}
                  </motion.div>
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
