// Mock metrics & alerts API

export interface KpiValues {
  totalConversations: number;
  containmentRate: number;
  cacheHitRate: number;
  escalationRate: number;
  p0SlaFirstResponse: number;
  p1SlaFirstResponse: number;
  p2SlaFirstResponse: number;
}

export interface ConfidenceBands {
  high: number;
  medium: number;
  low: number;
}

export interface MetricsSnapshot {
  tenantId: string;
  env: string;
  range: string;
  generatedAt: string;
  kpis: KpiValues;
  confidenceBands: ConfidenceBands;
}

export interface AlertEvent {
  id: string;
  severity: "critical" | "warning" | "info";
  type: string;
  message: string;
  createdAt: string;
}

export interface TrendPoint {
  date: string;
  conversations: number;
  containment: number;
  escalation: number;
}

export interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

// ── Seed data ──

const snapshotDev: MetricsSnapshot = {
  tenantId: "realx",
  env: "dev",
  range: "7d",
  generatedAt: "2026-02-28T10:00:00Z",
  kpis: {
    totalConversations: 1240,
    containmentRate: 0.71,
    cacheHitRate: 0.33,
    escalationRate: 0.29,
    p0SlaFirstResponse: 0.92,
    p1SlaFirstResponse: 0.88,
    p2SlaFirstResponse: 0.95,
  },
  confidenceBands: { high: 0.54, medium: 0.31, low: 0.15 },
};

const snapshotProd: MetricsSnapshot = {
  tenantId: "realx",
  env: "prod",
  range: "7d",
  generatedAt: "2026-02-28T10:00:00Z",
  kpis: {
    totalConversations: 8420,
    containmentRate: 0.78,
    cacheHitRate: 0.41,
    escalationRate: 0.22,
    p0SlaFirstResponse: 0.96,
    p1SlaFirstResponse: 0.93,
    p2SlaFirstResponse: 0.97,
  },
  confidenceBands: { high: 0.62, medium: 0.27, low: 0.11 },
};

const alertsDev: AlertEvent[] = [
  {
    id: "ae_1",
    severity: "warning",
    type: "SLA_AT_RISK",
    message: "P1 first response trending above 15m",
    createdAt: "2026-02-28T09:10:00Z",
  },
  {
    id: "ae_2",
    severity: "info",
    type: "LOW_CONFIDENCE",
    message: "12 conversations flagged low confidence in last 2h",
    createdAt: "2026-02-28T08:45:00Z",
  },
];

const alertsProd: AlertEvent[] = [];

// ── Trend data (7 days) ──

function generateTrend(base: number, containBase: number, env: string): TrendPoint[] {
  const days = 7;
  const points: TrendPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date("2026-02-22");
    d.setDate(d.getDate() + i);
    const jitter = env === "dev" ? (Math.sin(i * 1.5) * 0.06) : (Math.sin(i * 1.2) * 0.04);
    const convJitter = env === "dev" ? Math.round(Math.sin(i * 2) * 40) : Math.round(Math.sin(i * 1.8) * 120);
    points.push({
      date: d.toISOString().slice(0, 10),
      conversations: base + convJitter,
      containment: Math.round((containBase + jitter) * 100) / 100,
      escalation: Math.round((1 - containBase - jitter) * 0.4 * 100) / 100,
    });
  }
  return points;
}

const trendsDev = generateTrend(177, 0.71, "dev");
const trendsProd = generateTrend(1203, 0.78, "prod");

// ── Funnel data ──

function generateFunnel(total: number, containment: number): FunnelStep[] {
  const contained = Math.round(total * containment);
  const escalated = Math.round(total * 0.18);
  const dropped = total - contained - escalated;
  return [
    { label: "Total Conversations", value: total, color: "hsl(var(--primary))" },
    { label: "Bot Resolved", value: contained, color: "hsl(var(--success))" },
    { label: "Escalated", value: escalated, color: "hsl(var(--warning))" },
    { label: "Dropped / Unresolved", value: dropped, color: "hsl(var(--destructive))" },
  ];
}

// ── Public API ──

export function getMetricsSnapshot(env: string): MetricsSnapshot {
  return env === "prod" ? snapshotProd : snapshotDev;
}

export function getActiveAlerts(env: string): AlertEvent[] {
  return env === "prod" ? alertsProd : alertsDev;
}

export function getTrendData(env: string): TrendPoint[] {
  return env === "prod" ? trendsProd : trendsDev;
}

export function getFunnelData(env: string): FunnelStep[] {
  const snap = env === "prod" ? snapshotProd : snapshotDev;
  return generateFunnel(snap.kpis.totalConversations, snap.kpis.containmentRate);
}

export function getDailySummary(env: string): { label: string; value: string }[] {
  const snap = env === "prod" ? snapshotProd : snapshotDev;
  return [
    { label: "Conversations today", value: String(Math.round(snap.kpis.totalConversations / 7)) },
    { label: "Avg containment", value: `${Math.round(snap.kpis.containmentRate * 100)}%` },
    { label: "Open escalations", value: String(Math.round(snap.kpis.totalConversations * snap.kpis.escalationRate * 0.1)) },
    { label: "Cache hits", value: `${Math.round(snap.kpis.cacheHitRate * 100)}%` },
  ];
}
