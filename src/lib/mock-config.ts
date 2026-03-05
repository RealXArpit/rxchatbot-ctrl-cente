// Mock configuration data layer

export interface RoutingConfig {
  threshold: number;
  confidenceBands: { high: number; medium: number };
}

export interface RetentionConfig {
  messagesDays: number;
  escalationsDays: number;
  auditLogsYears: number;
  cacheTTLdays: number;
}

export interface EscalationPolicyConfig {
  businessHours: string;
  sla: Record<string, string>;
}

export interface FullConfig {
  routing: RoutingConfig;
  retention: RetentionConfig;
  escalation: EscalationPolicyConfig;
}

export interface WorkflowVersion {
  id: string;
  tenantId: string;
  env: string;
  status: "Draft" | "Proposed" | "Approved" | "Published" | "Rolled Back";
  version: string;
  config: FullConfig;
  previousConfig: FullConfig | null;
  reason: string;
  ticketRef: string | null;
  actorId: string;
  actorName: string;
  createdAt: string;
  updatedAt: string;
}

// ── Default configs ──

const DEFAULT_CONFIG: FullConfig = {
  routing: { threshold: 0.72, confidenceBands: { high: 0.72, medium: 0.55 } },
  retention: { messagesDays: 90, escalationsDays: 365, auditLogsYears: 5, cacheTTLdays: 30 },
  escalation: {
    businessHours: "Mon-Sat 10:00-19:00 IST",
    sla: { P0: "5m/2h", P1: "15m/6h", P2: "60m/24h" },
  },
};

const ALT_CONFIG: FullConfig = {
  routing: { threshold: 0.68, confidenceBands: { high: 0.68, medium: 0.50 } },
  retention: { messagesDays: 90, escalationsDays: 365, auditLogsYears: 5, cacheTTLdays: 30 },
  escalation: {
    businessHours: "Mon-Sat 10:00-19:00 IST",
    sla: { P0: "5m/2h", P1: "15m/6h", P2: "60m/24h" },
  },
};

// ── Seed versions ──

let versionsDev: WorkflowVersion[] = [
  {
    id: "wv_001", tenantId: "realx", env: "dev", status: "Published",
    version: "1.0.0", config: DEFAULT_CONFIG, previousConfig: null,
    reason: "Initial published config", ticketRef: null,
    actorId: "u_001", actorName: "Arpit",
    createdAt: "2026-02-10T10:00:00Z", updatedAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "wv_002", tenantId: "realx", env: "dev", status: "Rolled Back",
    version: "1.1.0", config: ALT_CONFIG, previousConfig: DEFAULT_CONFIG,
    reason: "Lower threshold experiment", ticketRef: "JIRA-101",
    actorId: "u_001", actorName: "Arpit",
    createdAt: "2026-02-15T08:00:00Z", updatedAt: "2026-02-18T09:00:00Z",
  },
  {
    id: "wv_003", tenantId: "realx", env: "dev", status: "Published",
    version: "1.2.0", config: DEFAULT_CONFIG, previousConfig: ALT_CONFIG,
    reason: "Restored after rollback", ticketRef: null,
    actorId: "u_001", actorName: "Arpit",
    createdAt: "2026-02-18T10:00:00Z", updatedAt: "2026-02-18T10:00:00Z",
  },
  {
    id: "wv_004", tenantId: "realx", env: "dev", status: "Approved",
    version: "1.3.0",
    config: { ...DEFAULT_CONFIG, routing: { threshold: 0.75, confidenceBands: { high: 0.75, medium: 0.58 } } },
    previousConfig: DEFAULT_CONFIG,
    reason: "Raise confidence threshold", ticketRef: null,
    actorId: "u_ops_1", actorName: "Ops Manager",
    createdAt: "2026-02-25T11:00:00Z", updatedAt: "2026-02-26T14:00:00Z",
  },
  {
    id: "wv_005", tenantId: "realx", env: "dev", status: "Proposed",
    version: "1.4.0",
    config: { ...DEFAULT_CONFIG, retention: { ...DEFAULT_CONFIG.retention, messagesDays: 120 } },
    previousConfig: DEFAULT_CONFIG,
    reason: "Extend message retention to 120 days", ticketRef: null,
    actorId: "u_ops_1", actorName: "Ops Manager",
    createdAt: "2026-02-27T09:00:00Z", updatedAt: "2026-02-27T09:00:00Z",
  },
  {
    id: "wv_006", tenantId: "realx", env: "dev", status: "Draft",
    version: "1.5.0",
    config: { ...DEFAULT_CONFIG, escalation: { ...DEFAULT_CONFIG.escalation, sla: { P0: "3m/1h", P1: "10m/4h", P2: "30m/12h" } } },
    previousConfig: DEFAULT_CONFIG,
    reason: "Tighten SLA targets", ticketRef: null,
    actorId: "u_ops_1", actorName: "Ops Manager",
    createdAt: "2026-02-28T08:00:00Z", updatedAt: "2026-02-28T08:00:00Z",
  },
];

// ── Current config ──

export function getCurrentConfig(env: string): FullConfig {
  if (env === "prod") return DEFAULT_CONFIG;
  const published = versionsDev.filter((v) => v.status === "Published").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return published[0]?.config ?? DEFAULT_CONFIG;
}

// ── Versions CRUD ──

export function getWorkflowVersions(env: string): WorkflowVersion[] {
  if (env === "prod") return versionsDev.filter((v) => v.status === "Published").slice(0, 1);
  return [...versionsDev].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getWorkflowVersion(env: string, versionId: string): WorkflowVersion | null {
  return versionsDev.find((v) => v.id === versionId) ?? null;
}

export function proposeVersion(env: string, config: FullConfig, reason: string, actorName: string): WorkflowVersion {
  const current = getCurrentConfig(env);
  const num = versionsDev.length + 1;
  const v: WorkflowVersion = {
    id: `wv_${String(num).padStart(3, "0")}`,
    tenantId: "realx", env,
    status: "Proposed",
    version: `1.${num}.0`,
    config, previousConfig: current,
    reason, ticketRef: null,
    actorId: "u_current", actorName,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  versionsDev = [v, ...versionsDev];
  return v;
}

export function approveVersion(versionId: string): WorkflowVersion | null {
  const idx = versionsDev.findIndex((v) => v.id === versionId);
  if (idx === -1 || versionsDev[idx].status !== "Proposed") return null;
  versionsDev[idx] = { ...versionsDev[idx], status: "Approved", updatedAt: new Date().toISOString() };
  versionsDev = [...versionsDev];
  return versionsDev[idx];
}

export function publishVersion(versionId: string): WorkflowVersion | null {
  const idx = versionsDev.findIndex((v) => v.id === versionId);
  if (idx === -1 || versionsDev[idx].status !== "Approved") return null;
  versionsDev[idx] = { ...versionsDev[idx], status: "Published", updatedAt: new Date().toISOString() };
  versionsDev = [...versionsDev];
  return versionsDev[idx];
}

export function rollbackVersion(versionId: string, reason: string, ticketRef: string): WorkflowVersion | null {
  const idx = versionsDev.findIndex((v) => v.id === versionId);
  if (idx === -1 || versionsDev[idx].status !== "Published") return null;
  versionsDev[idx] = { ...versionsDev[idx], status: "Rolled Back", reason, ticketRef, updatedAt: new Date().toISOString() };
  versionsDev = [...versionsDev];
  // Re-publish the previous config
  const prev = versionsDev[idx].previousConfig;
  if (prev) {
    const num = versionsDev.length + 1;
    const restored: WorkflowVersion = {
      id: `wv_${String(num).padStart(3, "0")}`,
      tenantId: "realx", env: versionsDev[idx].env,
      status: "Published",
      version: `1.${num}.0`,
      config: prev, previousConfig: versionsDev[idx].config,
      reason: `Rollback from ${versionsDev[idx].version}: ${reason}`,
      ticketRef,
      actorId: "u_current", actorName: "System",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    versionsDev = [restored, ...versionsDev];
  }
  return versionsDev[idx];
}
