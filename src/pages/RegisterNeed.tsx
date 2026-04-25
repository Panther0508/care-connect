import { useEffect, useState } from "react";
import { Eye, ShieldPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/AppLayout";
import { addNeed, getNeeds, removeNeed, type RegisteredNeed } from "@/lib/needs";
import { toast } from "@/hooks/use-toast";

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
    // brief delay to show loading state
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
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <ShieldPlus className="h-3.5 w-3.5 text-accent" />
          Register a need
        </div>
        <h1 className="mt-4 text-2xl md:text-4xl font-bold leading-tight">
          We'll watch for the care your{" "}
          <span className="text-gradient-primary">family needs</span>,
          <br className="hidden sm:block" /> even while you're away.
        </h1>
      </header>

      <form
        onSubmit={handleSave}
        className="glass-strong mt-6 rounded-2xl p-4 animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <label htmlFor="need" className="text-sm font-medium">
          Describe the care you need
        </label>
        <Textarea
          id="need"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Speech therapy for child under 5, within 20km"
          className="mt-2 min-h-[120px] bg-secondary/40 border-border/60 resize-none text-base"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Stored privately on this device until a match is found.
          </p>
          <Button type="submit" variant="hero" disabled={saving || !text.trim()}>
            {saving ? "Saving…" : "Save Need"}
          </Button>
        </div>
      </form>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Currently watching ({needs.length})
        </h2>

        {needs.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
            <Eye className="mx-auto h-6 w-6 text-muted-foreground/60" />
            <p className="mt-2">No needs registered yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {needs.map((n) => (
              <li
                key={n.id}
                className="glass flex items-start justify-between gap-3 rounded-xl p-4 animate-fade-up"
              >
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{n.text}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Watching since {new Date(n.createdAt).toLocaleString()}
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
