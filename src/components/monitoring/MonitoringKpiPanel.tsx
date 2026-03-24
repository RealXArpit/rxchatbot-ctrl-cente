import { useTenant } from "@/contexts/TenantContext";
import { getMetricsSnapshot } from "@/lib/mock-metrics";
import { SLA_DEFAULTS, BUSINESS_HOURS } from "@/lib/mock-monitoring";
import { cn } from "@/lib/utils";

interface TelemetryGaugeProps {
  label: string;
  value: string;
  subtitle: string;
  status: "success" | "warning" | "danger";
}

const statusColors: Record<string, { border: string; text: string; dot: string; bg: string }> = {
  success: {
    border: "border-t-[hsl(var(--success))]",
    text: "text-[hsl(var(--success))]",
    dot: "bg-[hsl(var(--success))]",
    bg: "shadow-[inset_0_1px_0_0_hsl(var(--success)/0.1)]",
  },
  warning: {
    border: "border-t-[hsl(var(--warning))]",
    text: "text-[hsl(var(--warning))]",
    dot: "bg-[hsl(var(--warning))]",
    bg: "shadow-[inset_0_1px_0_0_hsl(var(--warning)/0.1)]",
  },
  danger: {
    border: "border-t-[hsl(var(--destructive))]",
    text: "text-[hsl(var(--destructive))]",
    dot: "bg-[hsl(var(--destructive))]",
    bg: "shadow-[inset_0_1px_0_0_hsl(var(--destructive)/0.1)]",
  },
};

function TelemetryGauge({ label, value, subtitle, status }: TelemetryGaugeProps) {
  const colors = statusColors[status];
  const atRisk = status === "warning" || status === "danger";

  return (
    <div
      className={cn(
        "rounded-lg border-t-[3px] border border-border bg-slate-900 dark:bg-slate-950 p-4 flex flex-col gap-1.5 relative overflow-hidden",
        colors.border,
        colors.bg
      )}
    >
      {/* Header row with label and status dot */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest truncate">
          {label}
        </span>
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {atRisk && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                colors.dot
              )}
            />
          )}
          <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", colors.dot)} />
        </span>
      </div>

      {/* Value */}
      <span className={cn("text-3xl font-bold font-mono tabular-nums leading-none", colors.text)}>
        {value}
      </span>

      {/* Subtitle */}
      <span className="text-[10px] text-slate-500 leading-tight">{subtitle}</span>
    </div>
  );
}

export function MonitoringKpiPanel() {
  const { env } = useTenant();
  const snap = getMetricsSnapshot(env);
  const k = snap.kpis;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
          Live Performance
        </h2>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--success))]" />
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="dark:border-t-[1.5px] dark:border-t-[color:hsl(var(--success))]">
          <TelemetryGauge
            label="Containment"
            value={`${Math.round(k.containmentRate * 100)}%`}
            subtitle="Bot resolved without human help"
            status={k.containmentRate >= 0.7 ? "success" : "warning"}
          />
        </div>
        <div className={`dark:border-t-[1.5px] ${k.escalationRate > 0.25 ? "dark:border-t-[color:hsl(var(--warning))]" : "dark:border-t-[color:hsl(var(--success))]"}`}>
          <TelemetryGauge
            label="Escalation"
            value={`${Math.round(k.escalationRate * 100)}%`}
            subtitle="Handed to human agent"
            status={k.escalationRate > 0.25 ? "warning" : "success"}
          />
        </div>
        <div className="dark:border-t-[1.5px] dark:border-t-[color:hsl(var(--success))]">
          <TelemetryGauge
            label="Cache Hit"
            value={`${Math.round(k.cacheHitRate * 100)}%`}
            subtitle="Answered from memory, no AI call"
            status={k.cacheHitRate >= 0.3 ? "success" : "warning"}
          />
        </div>
        <div className={`dark:border-t-[1.5px] ${k.p0SlaFirstResponse >= 0.9 ? "dark:border-t-[color:hsl(var(--success))]" : "dark:border-t-[color:hsl(var(--destructive))]"}`}>
          <TelemetryGauge
            label="P0 SLA Met"
            value={`${Math.round(k.p0SlaFirstResponse * 100)}%`}
            subtitle="Critical — response within 5 min"
            status={k.p0SlaFirstResponse >= 0.9 ? "success" : "danger"}
          />
        </div>
        <div className={`dark:border-t-[1.5px] ${k.p1SlaFirstResponse >= 0.85 ? "dark:border-t-[color:hsl(var(--success))]" : "dark:border-t-[color:hsl(var(--warning))]"}`}>
          <TelemetryGauge
            label="P1 SLA Met"
            value={`${Math.round(k.p1SlaFirstResponse * 100)}%`}
            subtitle="High — response within 60 min"
            status={k.p1SlaFirstResponse >= 0.85 ? "success" : "warning"}
          />
        </div>
        <div className={`dark:border-t-[1.5px] ${k.p2SlaFirstResponse >= 0.9 ? "dark:border-t-[color:hsl(var(--success))]" : "dark:border-t-[color:hsl(var(--warning))]"}`}>
          <TelemetryGauge
            label="P2 SLA Met"
            value={`${Math.round(k.p2SlaFirstResponse * 100)}%`}
            subtitle="Standard — response within 4 hours"
            status={k.p2SlaFirstResponse >= 0.9 ? "success" : "warning"}
          />
        </div>
      </div>
    </div>
  );
}
