import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { getTrendData } from "@/lib/mock-metrics";
import { TrendChartCard } from "@/components/dashboard/TrendChartCard";
import { ConfidenceBandLegend } from "@/components/dashboard/ConfidenceBandLegend";
import { getMetricsSnapshot } from "@/lib/mock-metrics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MetricsExplorer() {
  const { env } = useTenant();
  const [range] = useState("7d");
  const trend = getTrendData(env);
  const snap = getMetricsSnapshot(env);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Metrics Explorer</h2>
        <div className="flex items-center gap-2">
          <Select value={range} disabled>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select disabled>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="All cohorts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cohorts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrendChartCard data={trend} />
        <ConfidenceBandLegend bands={snap.confidenceBands} />
      </div>
    </div>
  );
}
