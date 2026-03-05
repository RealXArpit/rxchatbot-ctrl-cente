// Mock monitoring: alert rules + alert events

export interface AlertRule {
  id: string;
  tenantId: string;
  env: string;
  name: string;
  metric: string;
  operator: ">" | "<" | ">=" | "<=" | "==";
  threshold: number;
  window: string;
  severity: "critical" | "warning" | "info";
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertEvent {
  id: string;
  tenantId: string;
  env: string;
  ruleId: string;
  ruleName: string;
  severity: "critical" | "warning" | "info";
  message: string;
  value: number;
  threshold: number;
  createdAt: string;
  acknowledged: boolean;
}

// ── Seed rules ──

let rulesDev: AlertRule[] = [
  {
    id: "ar_01",
    tenantId: "realx",
    env: "dev",
    name: "P1 First Response SLA at risk",
    metric: "p1FirstResponseMinutesP95",
    operator: ">",
    threshold: 15,
    window: "60m",
    severity: "warning",
    enabled: true,
    createdAt: "2026-02-20T10:00:00Z",
    updatedAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "ar_02",
    tenantId: "realx",
    env: "dev",
    name: "Containment rate drop",
    metric: "containmentRate",
    operator: "<",
    threshold: 0.65,
    window: "30m",
    severity: "critical",
    enabled: true,
    createdAt: "2026-02-21T08:00:00Z",
    updatedAt: "2026-02-21T08:00:00Z",
  },
  {
    id: "ar_03",
    tenantId: "realx",
    env: "dev",
    name: "Low confidence spike",
    metric: "lowConfidenceConversationsPercent",
    operator: ">",
    threshold: 20,
    window: "120m",
    severity: "warning",
    enabled: true,
    createdAt: "2026-02-22T12:00:00Z",
    updatedAt: "2026-02-22T12:00:00Z",
  },
  {
    id: "ar_04",
    tenantId: "realx",
    env: "dev",
    name: "Escalation rate high",
    metric: "escalationRate",
    operator: ">",
    threshold: 0.3,
    window: "60m",
    severity: "critical",
    enabled: false,
    createdAt: "2026-02-23T09:00:00Z",
    updatedAt: "2026-02-25T09:00:00Z",
  },
  {
    id: "ar_05",
    tenantId: "realx",
    env: "dev",
    name: "Cache hit rate low",
    metric: "cacheHitRate",
    operator: "<",
    threshold: 0.25,
    window: "60m",
    severity: "info",
    enabled: true,
    createdAt: "2026-02-24T14:00:00Z",
    updatedAt: "2026-02-24T14:00:00Z",
  },
];

// ── Seed events (20) ──

function seedEvents(): AlertEvent[] {
  const events: AlertEvent[] = [];
  const templates: { ruleId: string; ruleName: string; severity: AlertEvent["severity"]; message: string; value: number; threshold: number }[] = [
    { ruleId: "ar_01", ruleName: "P1 First Response SLA at risk", severity: "warning", message: "P1 first-response p95 = 18m (threshold 15m)", value: 18, threshold: 15 },
    { ruleId: "ar_02", ruleName: "Containment rate drop", severity: "critical", message: "Containment rate dropped to 61% (threshold 65%)", value: 0.61, threshold: 0.65 },
    { ruleId: "ar_03", ruleName: "Low confidence spike", severity: "warning", message: "22% conversations below confidence (threshold 20%)", value: 22, threshold: 20 },
    { ruleId: "ar_05", ruleName: "Cache hit rate low", severity: "info", message: "Cache hit rate at 22% (threshold 25%)", value: 0.22, threshold: 0.25 },
    { ruleId: "ar_01", ruleName: "P1 First Response SLA at risk", severity: "warning", message: "P1 first-response p95 = 16m (threshold 15m)", value: 16, threshold: 15 },
  ];

  for (let i = 0; i < 20; i++) {
    const t = templates[i % templates.length];
    const d = new Date("2026-02-22T08:00:00Z");
    d.setHours(d.getHours() + i * 7);
    events.push({
      id: `ae_${String(i + 1).padStart(3, "0")}`,
      tenantId: "realx",
      env: "dev",
      ruleId: t.ruleId,
      ruleName: t.ruleName,
      severity: t.severity,
      message: t.message,
      value: t.value,
      threshold: t.threshold,
      createdAt: d.toISOString(),
      acknowledged: i < 5,
    });
  }
  return events;
}

let eventsDev = seedEvents();

// ── Public API ──

export function getAlertRules(env: string): AlertRule[] {
  if (env === "prod") return [];
  return [...rulesDev];
}

export function getAlertRule(env: string, ruleId: string): AlertRule | null {
  if (env === "prod") return null;
  return rulesDev.find((r) => r.id === ruleId) ?? null;
}

export function createAlertRule(env: string, data: Omit<AlertRule, "id" | "tenantId" | "env" | "createdAt" | "updatedAt">): AlertRule {
  const rule: AlertRule = {
    ...data,
    id: `ar_${String(rulesDev.length + 1).padStart(2, "0")}`,
    tenantId: "realx",
    env,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rulesDev = [...rulesDev, rule];
  return rule;
}

export function updateAlertRule(env: string, ruleId: string, data: Partial<Pick<AlertRule, "name" | "metric" | "operator" | "threshold" | "window" | "severity" | "enabled">>): AlertRule | null {
  const idx = rulesDev.findIndex((r) => r.id === ruleId);
  if (idx === -1) return null;
  rulesDev[idx] = { ...rulesDev[idx], ...data, updatedAt: new Date().toISOString() };
  rulesDev = [...rulesDev];
  return rulesDev[idx];
}

export function getAlertEvents(env: string, filters?: { severity?: string; ruleId?: string }): AlertEvent[] {
  if (env === "prod") return [];
  let result = [...eventsDev];
  if (filters?.severity) result = result.filter((e) => e.severity === filters.severity);
  if (filters?.ruleId) result = result.filter((e) => e.ruleId === filters.ruleId);
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getDangerEventCount(env: string): number {
  if (env === "prod") return 0;
  return eventsDev.filter((e) => e.severity === "critical" && !e.acknowledged).length;
}

export const METRIC_OPTIONS = [
  { value: "p1FirstResponseMinutesP95", label: "P1 First Response (p95 min)" },
  { value: "containmentRate", label: "Containment Rate" },
  { value: "escalationRate", label: "Escalation Rate" },
  { value: "cacheHitRate", label: "Cache Hit Rate" },
  { value: "lowConfidenceConversationsPercent", label: "Low Confidence Conversations %" },
] as const;

export const OPERATOR_OPTIONS = [">", "<", ">=", "<=", "=="] as const;
export const WINDOW_OPTIONS = ["15m", "30m", "60m", "120m", "6h", "24h"] as const;
export const SEVERITY_OPTIONS = ["critical", "warning", "info"] as const;

export const SLA_DEFAULTS = {
  P0: { firstResponseMinutes: 5, resolutionHours: 2 },
  P1: { firstResponseMinutes: 15, resolutionHours: 6 },
  P2: { firstResponseMinutes: 60, resolutionHours: 24 },
};

export const BUSINESS_HOURS = {
  days: "Mon–Sat",
  start: "10:00 IST",
  end: "19:00 IST",
};
