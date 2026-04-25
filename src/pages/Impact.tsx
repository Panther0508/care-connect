import { useEffect, useRef, useState } from "react";
import {
  Building2,
  HeartHandshake,
  Quote,
  Users,
  TrendingUp,
  Globe2,
  Clock,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { getImpactStats, type ImpactStats } from "@/lib/api";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

const SECONDARY_STATS = [
  { icon: Clock, label: "Avg. match time", value: "47 min" },
  { icon: TrendingUp, label: "Confirmation rate", value: "92%" },
  { icon: Globe2, label: "Regions covered", value: "14" },
];

const TESTIMONIALS = [
  {
    quote:
      "I registered for paediatric care while travelling. CareSentinel found a clinic 8km from home before I returned.",
    name: "Adaeze",
    role: "Parent · Enugu",
  },
  {
    quote:
      "The confirmation code held my place. We arrived and walked straight in — no queue, no missed appointment.",
    name: "Ibrahim",
    role: "Family caregiver · Kano",
  },
];

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
          desc: "Active households trusting CareSentinel to watch over their loved ones today.",
        },
        {
          label: "Care Connections Made",
          value: stats.careConnectionsMade,
          icon: HeartHandshake,
          gradient: "bg-gradient-accent",
          desc: "Reservations confirmed and care delivered since CareSentinel launched.",
        },
        {
          label: "Facilities Monitored",
          value: stats.facilitiesMonitored,
          icon: Building2,
          gradient: "bg-gradient-primary",
          desc: "Clinics, outposts, and mobile units reporting capacity in real time.",
        },
      ]
    : [];

  return (
    <AppLayout>
      <header className="animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium text-muted-foreground">
          <HeartHandshake className="h-4 w-4 text-accent" />
          Impact dashboard
        </div>
        <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight">
          Quietly building a{" "}
          <span className="text-gradient-primary">network of care.</span>
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Every search, every confirmation, every piece of feedback teaches CareSentinel
          to find the right care, faster, for the next family.
        </p>
      </header>

      {/* Primary stats */}
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {!stats
          ? [0, 1, 2].map((i) => (
              <div key={i} className="glass h-52 rounded-2xl animate-pulse" />
            ))
          : cards.map(({ label, value, icon: Icon, gradient, desc }, idx) => (
              <div
                key={label}
                className="glass-strong group relative overflow-hidden rounded-2xl p-6 animate-fade-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div
                  className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-30 ${gradient}`}
                />
                <div className="relative flex flex-col gap-4">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${gradient} text-primary-foreground shadow-glow`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
                      <AnimatedNumber value={value} />
                    </p>
                    <p className="mt-1.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      {label}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
      </section>

      {/* Secondary stats strip */}
      <section className="mt-6 grid gap-3 sm:grid-cols-3 animate-fade-up">
        {SECONDARY_STATS.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="glass rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{value}</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Testimonials */}
      <section className="mt-12 animate-fade-up">
        <h2 className="text-2xl md:text-3xl font-bold">
          Words from families
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your confirmation improves matches for everyone.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="glass-strong rounded-2xl p-6 relative overflow-hidden"
            >
              <Quote className="h-7 w-7 text-accent" />
              <blockquote className="mt-4 text-base md:text-lg font-medium leading-relaxed">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold">{t.name}</span>
                <span className="text-muted-foreground"> · {t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="mt-12 mb-4 animate-fade-up">
        <div className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
          <h2 className="text-2xl md:text-3xl font-bold max-w-2xl">
            We measure ourselves in families reached, not screens viewed.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl leading-relaxed">
            Every reservation tunes our model. Every "Yes, it helped" sharpens the next
            recommendation. Together we are turning a patchwork of clinics into a single,
            quietly-vigilant safety net.
          </p>
        </div>
      </section>
    </AppLayout>
  );
};

export default Impact;
