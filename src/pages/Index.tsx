import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Sparkles,
  ShieldCheck,
  WifiOff,
  Heart,
  Activity,
  Clock,
  ArrowRight,
  MapPin,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { FacilityCard } from "@/components/FacilityCard";
import { searchCare, type Facility } from "@/lib/api";

const SUGGESTIONS = [
  "Pediatric malaria treatment",
  "Maternal care near Nsukka",
  "Speech therapy for child under 5",
  "Wound care",
  "Vaccinations",
];

const TRUST_FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified by care workers",
    desc: "Reports come directly from clinicians and community health workers, refreshed every few hours so you're never acting on stale information.",
  },
  {
    icon: WifiOff,
    title: "Built for weak signal",
    desc: "Searches and registered needs queue locally on your device and sync automatically the moment a connection returns — even just a few seconds.",
  },
  {
    icon: Sparkles,
    title: "Quiet background matching",
    desc: "Tell CareSentinel what your family needs once. We watch hundreds of facilities and ping you only when the right care is genuinely available.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Describe the care",
    desc: "Type what you need in plain language — symptoms, age, distance, anything. No medical jargon required.",
  },
  {
    step: "02",
    title: "We watch quietly",
    desc: "Our model cross-references live facility reports, capacity, and travel distance against your need.",
  },
  {
    step: "03",
    title: "Claim your spot",
    desc: "When a match opens up, you get a confirmation code that holds your reservation for two hours.",
  },
];

const HomePage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Facility[] | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async (q: string) => {
    setQuery(q);
    setLoading(true);
    const res = await searchCare(q);
    setResults(res);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    runSearch(query);
  };

  return (
    <AppLayout>
      {/* Hero */}
      <section className="text-center pt-4 md:pt-10 animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          AI guardian for underserved communities
        </div>

        <h1 className="mt-6 text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight">
          Find life-saving care,
          <br className="hidden sm:block" />{" "}
          <span className="text-gradient-primary">even without internet.</span>
        </h1>

        <p className="mt-6 text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          CareSentinel quietly watches hundreds of clinics, outposts, and mobile units —
          then alerts you the moment the right care becomes available for the people you love.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-accent" />
            12,480 families watching
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4 text-primary-glow" />
            184 facilities monitored
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-success" />
            Live reports
          </span>
        </div>
      </section>

      {/* Search */}
      <section className="mt-10 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <form
          onSubmit={handleSubmit}
          className="glass-strong relative flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl p-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe the care you need…"
              className="w-full bg-transparent outline-none pl-12 pr-4 h-14 text-base md:text-lg placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="submit"
            variant="hero"
            size="lg"
            disabled={loading || !query.trim()}
            className="sm:w-auto w-full text-base"
          >
            {loading ? "Searching…" : "Search Care"}
          </Button>
        </form>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Try one of these
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runSearch(s)}
                className="text-sm rounded-full border border-border/60 bg-secondary/40 px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-primary/40 transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      {results !== null && (
        <section className="mt-10 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold">
              {loading
                ? "Looking for care…"
                : `${results.length} ${results.length === 1 ? "facility" : "facilities"} ready to help`}
            </h2>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Sorted by distance
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {results.map((f) => (
              <FacilityCard key={f.id} facility={f} />
            ))}
          </div>
        </section>
      )}

      {/* Trust strip */}
      {results === null && (
        <>
          <section
            className="mt-16 animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center">
              A guardian that <span className="text-gradient-accent">never sleeps</span>
            </h2>
            <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
              Three quiet promises that keep your family safer.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {TRUST_FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass rounded-2xl p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary-glow shadow-glow">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="mt-16 animate-fade-up">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  How CareSentinel works
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Three steps from worry to confirmed care.
                </p>
              </div>
              <Button asChild variant="glass" size="lg">
                <Link to="/register-need">
                  Register a need
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {HOW_IT_WORKS.map(({ step, title, desc }) => (
                <div
                  key={step}
                  className="glass-strong rounded-2xl p-6 relative overflow-hidden"
                >
                  <span className="absolute right-4 top-4 font-display text-5xl font-extrabold text-primary/15">
                    {step}
                  </span>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-16 mb-4 animate-fade-up">
            <div className="glass-strong rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-gradient-accent opacity-15 blur-3xl" />

              <div className="relative">
                <Clock className="h-8 w-8 text-accent mx-auto" />
                <h2 className="mt-4 text-2xl md:text-4xl font-bold">
                  Every hour matters.
                </h2>
                <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                  Register a need now and CareSentinel starts watching immediately —
                  no account, no waiting room, no internet required.
                </p>
                <Button asChild variant="hero" size="xl" className="mt-6">
                  <Link to="/register-need">
                    Start watching for care
                    <ArrowRight className="ml-1 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
    </AppLayout>
  );
};

export default HomePage;
