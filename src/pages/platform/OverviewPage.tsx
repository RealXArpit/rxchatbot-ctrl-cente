import { PageHeader } from "@/components/platform/PageHeader";
import { RequireRole } from "@/components/platform/RequireRole";
import { routeMetadata } from "@/lib/mock-api";
import { useTenant } from "@/contexts/TenantContext";
import {
  getMetricsSnapshot,
  getActiveAlerts,
  getTrendData,
  getFunnelData,
  getDailySummary,
} from "@/lib/mock-metrics";
import { DashboardGrid, DashboardRow } from "@/components/dashboard/DashboardGrid";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChartCard } from "@/components/dashboard/TrendChartCard";
import { FunnelCard } from "@/components/dashboard/FunnelCard";
import { AlertList } from "@/components/dashboard/AlertList";
import { DailyWeeklySummaryCard } from "@/components/dashboard/DailyWeeklySummaryCard";
import { ConfidenceBandLegend } from "@/components/dashboard/ConfidenceBandLegend";
import { QuickActionsBar } from "@/components/dashboard/QuickActionsBar";
import { SavedViewPicker } from "@/components/dashboard/SavedViewPicker";

export default function OverviewPage() {
  const { env } = useTenant();
  const snapshot = getMetricsSnapshot(env);
  const alerts = getActiveAlerts(env);
  const trend = getTrendData(env);
  const funnel = getFunnelData(env);
  const summary = getDailySummary(env);
  const kpis = snapshot.kpis;

  return (
    <RequireRole allowedRoles={routeMetadata.overview.allowedRoles}>
      <DashboardGrid>
        <PageHeader
          title="Overview"
          subtitle="High-level metrics and system health at a glance."
          actions={<SavedViewPicker />}
        />

        {/* KPI Row */}
        <DashboardRow className="grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            label="Total Conversations"
            value={kpis.totalConversations.toLocaleString()}
            change={env === "dev" ? 5.2 : 3.1}
            tooltip="Total unique conversations in the selected period"
          />
          <KpiCard
            label="Containment Rate"
            value={`${Math.round(kpis.containmentRate * 100)}%`}
            change={env === "dev" ? 2.1 : 1.4}
            variant={kpis.containmentRate >= 0.7 ? "success" : "warning"}
            tooltip="Resolved_by_BOT / Total_Conversations"
          />
          <KpiCard
            label="Cache Hit Rate"
            value={`${Math.round(kpis.cacheHitRate * 100)}%`}
            change={env === "dev" ? -1.3 : 4.2}
            tooltip="CacheHit_Conversations / Total_Conversations"
          />
          <KpiCard
            label="Escalation Rate"
            value={`${Math.round(kpis.escalationRate * 100)}%`}
            change={env === "dev" ? -3.5 : -1.8}
            invertChange
            variant={kpis.escalationRate > 0.25 ? "warning" : "default"}
            tooltip="Conversations escalated to human agents / Total"
          />
          <KpiCard
            label="P0 SLA Met"
            value={`${Math.round(kpis.p0SlaFirstResponse * 100)}%`}
            change={env === "dev" ? 0.8 : 0.3}
            variant={kpis.p0SlaFirstResponse >= 0.9 ? "success" : "danger"}
            tooltip="% of P0 tickets with first response within SLA"
          />
        </DashboardRow>

        {/* Charts Row */}
        <DashboardRow className="grid-cols-1 lg:grid-cols-2">
          <TrendChartCard data={trend} />
          <FunnelCard data={funnel} />
        </DashboardRow>

        {/* Confidence Bands */}
        <ConfidenceBandLegend bands={snapshot.confidenceBands} />

        {/* Bottom Row */}
        <DashboardRow className="grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <AlertList alerts={alerts} />
          </div>
          <div className="lg:col-span-1">
            <DailyWeeklySummaryCard items={summary} />
          </div>
          <div className="lg:col-span-1">
            <QuickActionsBar />
          </div>
        </DashboardRow>
      </DashboardGrid>
    </RequireRole>
  );
}
