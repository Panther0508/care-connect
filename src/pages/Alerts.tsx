import { useEffect, useState } from "react";
import { BellRing, Inbox } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { FacilityCard } from "@/components/FacilityCard";
import { getAlerts, type Alert } from "@/lib/api";

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);

  useEffect(() => {
    getAlerts().then(setAlerts);
  }, []);

  return (
    <AppLayout>
      <header className="animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <BellRing className="h-3.5 w-3.5 text-accent" />
          Alert inbox
        </div>
        <h1 className="mt-4 text-2xl md:text-4xl font-bold leading-tight">
          Care matched to your{" "}
          <span className="text-gradient-accent">registered needs</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl">
          We surface only what fits. Claim quickly — capacity changes by the hour.
        </p>
      </header>

      <section className="mt-8">
        {alerts === null ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="glass h-44 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center animate-fade-up">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary-glow">
              <Inbox className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No alerts yet.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We're still watching — quietly, in the background.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {alerts.map((a) => (
              <div key={a.id} className="space-y-1">
                <FacilityCard
                  facility={a.facility}
                  tag={a.isNew ? "New Match" : undefined}
                  ctaLabel="Claim & Reserve"
                />
                <p className="px-2 text-[11px] text-muted-foreground">
                  Matched: <span className="text-foreground/80">"{a.matchedNeed}"</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
};

export default Alerts;
