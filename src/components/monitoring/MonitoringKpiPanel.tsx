import { useTenant } from "@/contexts/TenantContext";
import { getMetricsSnapshot } from "@/lib/mock-metrics";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SLA_DEFAULTS, BUSINESS_HOURS } from "@/lib/mock-monitoring";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function MonitoringKpiPanel() {
  const { env } = useTenant();
  const snap = getMetricsSnapshot(env);
  const k = snap.kpis;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-foreground">System KPIs</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px] text-xs">
            <p className="font-medium mb-1">SLA Defaults</p>
            <ul className="space-y-0.5">
              <li>P0: {SLA_DEFAULTS.P0.firstResponseMinutes}m first response / {SLA_DEFAULTS.P0.resolutionHours}h resolution</li>
              <li>P1: {SLA_DEFAULTS.P1.firstResponseMinutes}m / {SLA_DEFAULTS.P1.resolutionHours}h</li>
              <li>P2: {SLA_DEFAULTS.P2.firstResponseMinutes}m / {SLA_DEFAULTS.P2.resolutionHours}h</li>
            </ul>
            <p className="mt-1.5 font-medium">Business Hours</p>
            <p>{BUSINESS_HOURS.days}, {BUSINESS_HOURS.start}–{BUSINESS_HOURS.end}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Containment" value={`${Math.round(k.containmentRate * 100)}%`} variant={k.containmentRate >= 0.7 ? "success" : "warning"} tooltip="Bot-resolved / total conversations" />
        <KpiCard label="Escalation" value={`${Math.round(k.escalationRate * 100)}%`} variant={k.escalationRate > 0.25 ? "warning" : "default"} tooltip="Escalated / total" />
        <KpiCard label="Cache Hit" value={`${Math.round(k.cacheHitRate * 100)}%`} tooltip="Responses from cache" />
        <KpiCard label="P0 SLA Met" value={`${Math.round(k.p0SlaFirstResponse * 100)}%`} variant={k.p0SlaFirstResponse >= 0.9 ? "success" : "danger"} />
        <KpiCard label="P1 SLA Met" value={`${Math.round(k.p1SlaFirstResponse * 100)}%`} variant={k.p1SlaFirstResponse >= 0.85 ? "success" : "warning"} />
        <KpiCard label="P2 SLA Met" value={`${Math.round(k.p2SlaFirstResponse * 100)}%`} variant={k.p2SlaFirstResponse >= 0.9 ? "success" : "default"} />
      </div>
    </div>
  );
}
