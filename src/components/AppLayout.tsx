import { ReactNode } from "react";
import { BottomNav, SideNav } from "./Navigation";
import { OnlineStatusPill } from "./OnlineStatusPill";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full">
      <SideNav />

      {/* Top right floating online pill */}
      <div className="fixed top-4 right-4 z-50">
        <OnlineStatusPill />
      </div>

      <main className="md:pl-64 pb-28 md:pb-8 min-h-screen">
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 md:px-8 md:pt-10">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
