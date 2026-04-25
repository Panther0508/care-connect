import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, Inbox, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { FacilityCard } from "@/components/FacilityCard";
import { getAlerts, type Alert } from "@/lib/api";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return `${Math.floor(hr / 24)} d ago`;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);

  useEffect(() => {
    getAlerts().then(setAlerts);
  }, []);

  const newCount = alerts?.filter((a) => a.isNew).length ?? 0;

  return (
    <AppLayout>
      <header className="animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium text-muted-foreground">
          <BellRing className="h-4 w-4 text-accent" />
          Alert inbox
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              Care matched to your{" "}
              <span className="text-gradient-accent">registered needs</span>
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              We surface only what fits — verified facilities with real openings.
              Capacity changes by the hour, so claim quickly.
            </p>
          </div>

          {alerts && alerts.length > 0 && (
            <div className="glass-strong rounded-2xl px-5 py-4 text-center min-w-[140px]">
              <p className="font-display text-3xl font-extrabold text-gradient-primary">
                {newCount}
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                New matches
              </p>
            </div>
          )}
        </div>
      </header>

      <section className="mt-10">
        {alerts === null ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="glass h-56 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass-strong rounded-3xl p-12 text-center animate-fade-up">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary/20 text-primary-glow shadow-glow">
              <Inbox className="h-9 w-9" />
            </div>
            <h2 className="mt-6 text-2xl md:text-3xl font-bold">
              No alerts yet.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto leading-relaxed">
              We're still watching — quietly, in the background. The moment a facility
              matches one of your registered needs, you'll see it here first.
            </p>
            <Button asChild variant="hero" size="lg" className="mt-6">
              <Link to="/register-need">
                <Sparkles className="h-4 w-4" />
                Register a need to watch
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="glass-strong rounded-2xl p-5 md:p-6 animate-fade-up"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground shadow-amber uppercase tracking-wider">
                      {a.isNew ? "New Match" : "Match"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Matched {timeAgo(a.matchedAt)}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  Matched against:{" "}
                  <span className="text-foreground font-medium">"{a.matchedNeed}"</span>
                </p>

                <div className="mt-4">
                  <FacilityCard
                    facility={a.facility}
                    ctaLabel="Claim & Reserve"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
};

export default Alerts;
