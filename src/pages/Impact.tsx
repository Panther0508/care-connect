import { useEffect, useRef, useState } from "react";
import { Building2, HeartHandshake, Quote, Users } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { getImpactStats, type ImpactStats } from "@/lib/api";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

const Impact = () => {
  const [stats, setStats] = useState<ImpactStats | null>(null);

  useEffect(() => {
    getImpactStats().then(setStats);
  }, []);

  const cards = stats
    ? [
        {
          label: "Families Watching",
          value: stats.familiesWatching,
          icon: Users,
          gradient: "bg-gradient-primary",
        },
        {
          label: "Care Connections Made",
          value: stats.careConnectionsMade,
          icon: HeartHandshake,
          gradient: "bg-gradient-accent",
        },
        {
          label: "Facilities Monitored",
          value: stats.facilitiesMonitored,
          icon: Building2,
          gradient: "bg-gradient-primary",
        },
      ]
    : [];

  return (
    <AppLayout>
      <header className="animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <HeartHandshake className="h-3.5 w-3.5 text-accent" />
          Impact dashboard
        </div>
        <h1 className="mt-4 text-2xl md:text-4xl font-bold leading-tight">
          Quietly building a{" "}
          <span className="text-gradient-primary">network of care.</span>
        </h1>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {!stats
          ? [0, 1, 2].map((i) => (
              <div key={i} className="glass h-40 rounded-2xl animate-pulse" />
            ))
          : cards.map(({ label, value, icon: Icon, gradient }, idx) => (
              <div
                key={label}
                className="glass-strong group relative overflow-hidden rounded-2xl p-5 animate-fade-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div
                  className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-30 ${gradient}`}
                />
                <div className="relative flex flex-col gap-3">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${gradient} text-primary-foreground shadow-glow`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-3xl md:text-4xl font-bold tracking-tight animate-count-pop">
                      <AnimatedNumber value={value} />
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                      {label}
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </section>

      <section className="glass mt-8 rounded-2xl p-6 animate-fade-up">
        <Quote className="h-6 w-6 text-accent" />
        <blockquote className="mt-3 text-lg md:text-xl font-medium leading-relaxed">
          Your confirmation improves matches for everyone.
        </blockquote>
        <p className="mt-2 text-sm text-muted-foreground">
          Every reservation tunes our model — so the next family finds care faster.
        </p>
      </section>
    </AppLayout>
  );
};

export default Impact;
