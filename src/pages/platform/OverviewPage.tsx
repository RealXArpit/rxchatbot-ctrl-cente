import { PageHeader } from "@/components/platform/PageHeader";
import { RequireRole } from "@/components/platform/RequireRole";
import { routeMetadata } from "@/lib/mock-api";
import {
  getMetricsSnapshot,
  getActiveAlerts,
  getTrendData,
  getFunnelData,
  getDailySummary,
} from "@/lib/mock-metrics";
import {
  useDashboardSnapshot,
  useDashboardTrend,
  useDashboardFunnel,
  useDailyMetrics,
  useDashboardAlerts,
} from "@/hooks/useDashboardMetrics";
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
  // Live hooks
  const { data: liveSnapshot } = useDashboardSnapshot();
  const { data: liveTrend } = useDashboardTrend();
  const { data: liveFunnel } = useDashboardFunnel();
  const { data: liveDaily } = useDailyMetrics();
  const { data: liveAlerts } = useDashboardAlerts();

  // Fallback to mock when Supabase returns nothing
  const snapshot = (liveSnapshot && liveSnapshot.kpis.totalConversations > 0)
    ? liveSnapshot : getMetricsSnapshot("prod");
  const trend = (liveTrend && liveTrend.some(p => p.conversations > 0))
    ? liveTrend : getTrendData("prod");
  const funnel = (liveFunnel && liveFunnel.some(f => f.value > 0))
    ? liveFunnel : getFunnelData("prod");
  const daily = (liveDaily && liveDaily.length > 0)
    ? liveDaily : getDailySummary("prod");
  const alerts = liveAlerts ?? getActiveAlerts("prod");

  const kpis = snapshot.kpis;
  const isLive = liveSnapshot && liveSnapshot.kpis.totalConversations > 0;

  return (
    <RequireRole allowedRoles={routeMetadata.overview.allowedRoles}>
      <DashboardGrid>
        <PageHeader
          title="Overview"
          subtitle={isLive
            ? "Live data from Supabase · refreshes every 60s"
            : "Showing sample data — no conversations recorded yet"}
          actions={<SavedViewPicker />}
        />

        {/* KPI Row */}
        <DashboardRow className="grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            label="Total Conversations"
            value={kpis.totalConversations.toLocaleString()}
            tooltip="Total unique conversations"
          />
          <KpiCard
            label="Containment Rate"
            value={`${Math.round(kpis.containmentRate * 100)}%`}
            variant={kpis.containmentRate >= 0.7 ? "success" : "warning"}
            tooltip="Bot resolved without escalation / Total"
          />
          <KpiCard
            label="Cache Hit Rate"
            value={`${Math.round(kpis.cacheHitRate * 100)}%`}
            tooltip="Responses served from knowledge cache / Total"
          />
          <KpiCard
            label="Escalation Rate"
            value={`${Math.round(kpis.escalationRate * 100)}%`}
            invertChange
            variant={kpis.escalationRate > 0.25 ? "warning" : "default"}
            tooltip="Conversations routed to human agents / Total"
          />
          <KpiCard
            label="Confidence"
            value={`${Math.round(snapshot.confidenceBands.high * 100)}% high`}
            variant={snapshot.confidenceBands.high >= 0.6 ? "success" : "warning"}
            tooltip="% of conversations answered with high confidence (≥ 0.72)"
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
            <DailyWeeklySummaryCard items={daily} />
          </div>
          <div className="lg:col-span-1">
            <QuickActionsBar />
          </div>
        </DashboardRow>
      </DashboardGrid>
    </RequireRole>
  );
}
