import { useEffect, useState } from "react";
import { Eye, ShieldPlus, Trash2, Lightbulb, Lock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/AppLayout";
import { addNeed, getNeeds, removeNeed, type RegisteredNeed } from "@/lib/needs";
import { toast } from "@/hooks/use-toast";

const EXAMPLES = [
  "Speech therapy for a child under 5, within 20km of Awka",
  "Maternal ultrasound and prenatal checkup before next month",
  "Pediatric malaria treatment with isolation beds",
  "Diabetes medication refills near Enugu",
];

const TIPS = [
  {
    icon: Lightbulb,
    title: "Be specific",
    desc: "Mention age, condition, distance, and urgency — the more context, the sharper the matches.",
  },
  {
    icon: Lock,
    title: "Stays on your device",
    desc: "Needs are stored privately in your browser. Nothing leaves your phone unless we find a match.",
  },
  {
    icon: Bell,
    title: "Wakes you only when it matters",
    desc: "No spam. You'll only hear from us when a real, claimable opening appears nearby.",
  },
];

const RegisterNeed = () => {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [needs, setNeeds] = useState<RegisteredNeed[]>([]);

  useEffect(() => {
    setNeeds(getNeeds());
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    addNeed(text);
    setNeeds(getNeeds());
    setText("");
    setSaving(false);
    toast({
      title: "Your need is being watched.",
      description: "We'll alert you the moment we find a match.",
    });
  };

  const handleRemove = (id: string) => {
    setNeeds(removeNeed(id));
  };

  return (
    <AppLayout>
      <header className="animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium text-muted-foreground">
          <ShieldPlus className="h-4 w-4 text-accent" />
          Register a care need
        </div>
        <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight">
          We'll watch for the care your{" "}
          <span className="text-gradient-primary">family needs</span>,
          <br className="hidden sm:block" /> even while you're away.
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Tell CareSentinel exactly what you're looking for. We'll keep watch across
          every facility in your region and alert you the instant a match appears.
        </p>
      </header>

      <form
        onSubmit={handleSave}
        className="glass-strong mt-8 rounded-2xl p-5 md:p-6 animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <label htmlFor="need" className="text-base font-semibold">
          Describe the care you need
        </label>
        <p className="mt-1 text-sm text-muted-foreground">
          Plain words work best. Include who, what, and where.
        </p>
        <Textarea
          id="need"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Speech therapy for child under 5, within 20km of Awka"
          className="mt-3 min-h-[140px] bg-secondary/40 border-border/60 resize-none text-base leading-relaxed"
        />

        <div className="mt-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Need an example?
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setText(ex)}
                className="text-sm rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-primary/40 transition-all duration-200"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Stored privately on this device.
          </p>
          <Button
            type="submit"
            variant="hero"
            size="lg"
            disabled={saving || !text.trim()}
          >
            {saving ? "Saving…" : "Save Need & Start Watching"}
          </Button>
        </div>
      </form>

      {/* Tips */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3 animate-fade-up">
        {TIPS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass rounded-2xl p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-base font-bold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {desc}
            </p>
          </div>
        ))}
      </section>

      {/* Watching list */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">
              Currently watching
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {needs.length} active {needs.length === 1 ? "need" : "needs"} on this device
            </p>
          </div>
        </div>

        {needs.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
            <Eye className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-base font-medium text-foreground">
              No needs registered yet
            </p>
            <p className="mt-1">
              Once you save one above, it will appear here and we'll start watching.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {needs.map((n) => (
              <li
                key={n.id}
                className="glass flex items-start justify-between gap-3 rounded-2xl p-5 animate-fade-up"
              >
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />
                      <span className="relative h-2 w-2 rounded-full bg-success" />
                    </span>
                    WATCHING
                  </div>
                  <p className="mt-2 text-base leading-relaxed">{n.text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Registered {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(n.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Stop watching"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
};

export default RegisterNeed;
