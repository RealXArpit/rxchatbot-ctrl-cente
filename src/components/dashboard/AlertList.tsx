import { WidgetFrame } from "./WidgetFrame";
import { StatusPill } from "@/components/platform/StatusPill";
import { Timestamp } from "@/components/platform/Timestamp";
import type { AlertEvent } from "@/lib/mock-metrics";

const severityVariant: Record<string, "success" | "warning" | "danger" | "muted" | "primary"> = {
  critical: "danger",
  warning: "warning",
  info: "muted",
};

interface AlertListProps {
  alerts: AlertEvent[];
  loading?: boolean;
}

export function AlertList({ alerts, loading }: AlertListProps) {
  return (
    <WidgetFrame
      title="Active Alerts"
      subtitle={alerts.length > 0 ? `${alerts.length} alert${alerts.length > 1 ? "s" : ""}` : undefined}
      loading={loading}
      empty={alerts.length === 0}
      emptyMessage="No active alerts — all clear."
    >
      <ul className="divide-y divide-border -mx-4 -mb-4">
        {alerts.map((a) => (
          <li key={a.id} className="flex items-start gap-3 px-4 py-3">
            <StatusPill label={a.severity} variant={severityVariant[a.severity] ?? "muted"} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{a.message}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="uppercase tracking-wide">{a.type}</span>
                {" · "}
                <Timestamp date={a.createdAt} fmt="d MMM, HH:mm" />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </WidgetFrame>
  );
}
