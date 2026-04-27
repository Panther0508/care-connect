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
    to: "/health",
    label: "Health",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    )
  },
  {
    to: "/ai",
    label: "AI",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
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
  {
    to: "/outbreak",
    label: "Outbreaks",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
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
