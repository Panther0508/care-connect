import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

export function OnlineStatusPill({ className }: { className?: string }) {
  const online = useOnlineStatus();

  return (
    <div
      className={cn(
        "glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
        className,
      )}
      aria-live="polite"
    >
      <span
        className={cn(
          "pulse-dot relative inline-block h-2 w-2 rounded-full",
          online ? "bg-success text-success" : "bg-destructive text-destructive",
        )}
      />
      <span className={online ? "text-foreground" : "text-destructive"}>
        {online ? "Online" : "Offline"}
      </span>
    </div>
  );
}
