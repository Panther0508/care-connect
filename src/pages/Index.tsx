import { useState } from "react";
import { Search, Sparkles, ShieldCheck, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { FacilityCard } from "@/components/FacilityCard";
import { searchCare, type Facility } from "@/lib/api";

const SUGGESTIONS = [
  "Pediatric malaria treatment",
  "Maternal care near Nsukka",
  "Speech therapy for child under 5",
  "Wound care",
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
      <section className="text-center pt-6 md:pt-10 animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          AI guardian for underserved communities
        </div>

        <h1 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          Find life-saving care,
          <br className="hidden sm:block" />{" "}
          <span className="text-gradient-primary">even without internet.</span>
        </h1>

        <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          CareSentinel quietly watches across clinics and outposts, then alerts you
          the moment the right care becomes available.
        </p>
      </section>

      {/* Search */}
      <section className="mt-8 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <form
          onSubmit={handleSubmit}
          className="glass-strong relative flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl p-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe the care you need…"
              className="w-full bg-transparent outline-none pl-11 pr-4 h-12 text-base placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="submit"
            variant="hero"
            size="lg"
            disabled={loading || !query.trim()}
            className="sm:w-auto w-full"
          >
            {loading ? "Searching…" : "Search"}
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => runSearch(s)}
              className="text-xs rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Results */}
      {results !== null && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {loading
                ? "Looking for care…"
                : `${results.length} ${results.length === 1 ? "facility" : "facilities"} nearby`}
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {results.map((f) => (
              <FacilityCard key={f.id} facility={f} />
            ))}
          </div>
        </section>
      )}

      {/* Trust strip — only when no results yet */}
      {results === null && (
        <section className="mt-12 grid gap-3 sm:grid-cols-3 animate-fade-up" style={{ animationDelay: "160ms" }}>
          {[
            { icon: ShieldCheck, title: "Verified facilities", desc: "Reports from real care workers, refreshed daily." },
            { icon: WifiOff, title: "Works offline", desc: "Searches and alerts queue locally and sync when you reconnect." },
            { icon: Sparkles, title: "Quiet matching", desc: "We watch for your family's needs in the background." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary-glow">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </section>
      )}
    </AppLayout>
  );
};

export default HomePage;
