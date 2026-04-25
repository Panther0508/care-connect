import { Link } from "react-router-dom";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Facility } from "@/lib/api";

interface FacilityCardProps {
  facility: Facility;
  tag?: string;
  ctaLabel?: string;
}

export function FacilityCard({
  facility,
  tag,
  ctaLabel = "Claim Care",
}: FacilityCardProps) {
  return (
    <article className="glass group relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow animate-fade-up">
      {tag && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground shadow-amber">
            {tag}
          </span>
        </div>
      )}

      <h3 className="text-lg font-semibold leading-tight pr-20">
        {facility.facility}
      </h3>

      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        <span>{facility.location}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {facility.services.map((s) => (
          <Badge
            key={s}
            variant="secondary"
            className="bg-primary/10 text-primary-glow border border-primary/20 hover:bg-primary/15"
          >
            {s}
          </Badge>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted-foreground/90 leading-relaxed line-clamp-2">
        {facility.report_text}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <a
          href={`tel:${facility.contact}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Phone className="h-3.5 w-3.5" />
          {facility.contact}
        </a>

        <Button asChild size="sm" variant="hero">
          <Link to={`/reservation/${facility.id}`}>
            {ctaLabel}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
