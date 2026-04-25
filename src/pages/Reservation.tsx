import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin, Phone, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/AppLayout";
import { confirmReservation, getFacilityById, sendFeedback, type Facility } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Reservation {
  code: string;
  expiresAt: string;
}

function useCountdown(expiresAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return useMemo(() => {
    if (!expiresAt) return "—";
    const ms = new Date(expiresAt).getTime() - now;
    if (ms <= 0) return "Expired";
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }, [expiresAt, now]);
}

const Reservation = () => {
  const { facilityId } = useParams();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  // Pre-generate a placeholder code immediately for visual clarity
  const placeholderCode = useMemo(
    () => `CONF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    [],
  );

  const expiresAt = useMemo(
    () =>
      reservation?.expiresAt ??
      new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    [reservation],
  );

  const countdown = useCountdown(expiresAt);

  useEffect(() => {
    if (!facilityId) return;
    setLoading(true);
    getFacilityById(facilityId).then((f) => {
      setFacility(f);
      setLoading(false);
    });
  }, [facilityId]);

  const handleConfirm = async () => {
    if (!facilityId) return;
    setConfirming(true);
    const r = await confirmReservation(facilityId);
    setReservation(r);
    setConfirming(false);
    toast({
      title: "Care Secured",
      description: `Confirmation ${r.code} reserved for you.`,
    });
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!facilityId) return;
    setFeedback(helpful ? "yes" : "no");
    await sendFeedback(facilityId, helpful);
    toast({ title: "Thank you", description: "Your feedback improves matches for everyone." });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="glass h-72 rounded-2xl animate-pulse" />
      </AppLayout>
    );
  }

  if (!facility) {
    return (
      <AppLayout>
        <div className="glass rounded-2xl p-8 text-center">
          <h2 className="text-lg font-semibold">Facility not found</h2>
          <Button asChild variant="hero" className="mt-4">
            <Link to="/">Back to search</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const code = reservation?.code ?? placeholderCode;
  const confirmed = !!reservation;

  return (
    <AppLayout>
      <Link
        to="/alerts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <header className="mt-4 animate-fade-up">
        <h1 className="text-2xl md:text-4xl font-bold leading-tight">
          {facility.facility}
        </h1>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {facility.location}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {facility.services.map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className="bg-primary/10 text-primary-glow border border-primary/20"
            >
              {s}
            </Badge>
          ))}
        </div>

        <a
          href={`tel:${facility.contact}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Phone className="h-3.5 w-3.5" />
          {facility.contact}
        </a>
      </header>

      {/* Reservation card */}
      <section className="glass-strong mt-6 rounded-2xl p-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Confirmation code
            </p>
            <p className="mt-1 font-mono text-3xl md:text-4xl font-bold text-gradient-primary tracking-tight">
              {code}
            </p>
          </div>

          <div className="glass inline-flex items-center gap-2 rounded-xl px-3 py-2">
            <Timer className="h-4 w-4 text-accent" />
            <div className="leading-tight">
              <p className="text-[11px] text-muted-foreground">Expires in</p>
              <p className="text-sm font-semibold">{countdown}</p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          {facility.report_text}
        </p>

        {!confirmed ? (
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            variant="hero"
            size="lg"
            className="mt-6 w-full"
          >
            {confirming ? "Confirming…" : "Confirm Reservation"}
          </Button>
        ) : (
          <div className="mt-6 flex flex-col items-center text-center animate-fade-up">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-success/30 blur-2xl animate-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success/20 ring-1 ring-success/40">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/15 text-success px-3 py-1.5 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Care Secured
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Show your confirmation code on arrival.
            </p>
          </div>
        )}
      </section>

      {/* Feedback */}
      {confirmed && (
        <section className="glass mt-4 rounded-2xl p-5 animate-fade-up">
          <p className="text-sm font-medium">Did this help?</p>
          <div className="mt-3 flex gap-2">
            <Button
              variant={feedback === "yes" ? "hero" : "glass"}
              onClick={() => handleFeedback(true)}
              disabled={feedback !== null}
            >
              Yes, it helped
            </Button>
            <Button
              variant={feedback === "no" ? "amber" : "glass"}
              onClick={() => handleFeedback(false)}
              disabled={feedback !== null}
            >
              No, not yet
            </Button>
          </div>
        </section>
      )}
    </AppLayout>
  );
};

export default Reservation;
