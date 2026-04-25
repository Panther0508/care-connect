import { NavLink } from "react-router-dom";
import { Home, BellRing, HeartPulse, BarChart3, ShieldPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Search", icon: Home, end: true },
  { to: "/register-need", label: "Watch", icon: ShieldPlus },
  { to: "/alerts", label: "Alerts", icon: BellRing },
  { to: "/impact", label: "Impact", icon: BarChart3 },
];

/** Bottom nav for mobile */
export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40">
      <div className="glass-strong mx-3 mb-3 rounded-2xl px-2 py-2">
        <ul className="flex items-center justify-around">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-all duration-200",
                    isActive
                      ? "text-primary-glow"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                        isActive && "bg-primary/15 shadow-glow",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/** Sidebar for desktop */
export function SideNav() {
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col p-4">
      <div className="glass-strong flex h-full flex-col rounded-2xl p-4">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <HeartPulse className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">CareSentinel</div>
            <div className="text-[11px] text-muted-foreground">Offline-first guardian</div>
          </div>
        </div>

        <ul className="mt-4 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/15 text-primary-glow shadow-glow"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-auto rounded-xl border border-border/40 bg-secondary/40 p-3 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">Watching quietly</div>
          <p className="mt-1 leading-relaxed">
            CareSentinel keeps watch even when your connection drops.
          </p>
        </div>
      </div>
    </aside>
  );
}
