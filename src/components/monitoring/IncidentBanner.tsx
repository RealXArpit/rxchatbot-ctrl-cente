import { AlertTriangle } from "lucide-react";

interface IncidentBannerProps {
  count: number;
}

export function IncidentBanner({ count }: IncidentBannerProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 mb-4">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <p className="text-sm font-medium text-destructive">
        {count} unacknowledged critical alert{count > 1 ? "s" : ""} — review immediately.
      </p>
    </div>
  );
}
