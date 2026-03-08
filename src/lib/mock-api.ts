// Mock API layer for tenant + environment context

export type Role = "SuperAdmin" | "OpsManager" | "KnowledgeManager" | "SupportAgent" | "Auditor";

export interface TenantContext {
  tenantId: string;
  env: "dev" | "prod";
  org: { id: string; name: string };
  teams: { id: string; name: string }[];
  currentUser: { id: string; name: string; role: Role };
}

export interface BotConfig {
  id: string;
  tenantId: string;
  env: string;
  name: string;
  status: "active" | "inactive" | "draft";
}

export interface WorkflowVersion {
  id: string;
  tenantId: string;
  env: string;
  status: "published" | "draft" | "archived";
  version: string;
  createdAt: string;
}

export interface IntegrationCredential {
  id: string;
  tenantId: string;
  env: string;
  type: string;
  secretRef: string;
  status: "active" | "revoked";
}

export type AuditAction =
  | "KB_PUSH"
  | "KB_DEPRECATE"
  | "AGENT_REPLY"
  | "AGENT_TAKEOVER"
  | "AGENT_RESOLVE"
  | "FEEDBACK_SUBMIT"
  | "CONFIG_PROPOSE"
  | "CONFIG_APPROVE"
  | "CONFIG_PUBLISH"
  | "CONFIG_ROLLBACK"
  | "USER_LOGIN"
  | "USER_LOGOUT";

export interface AuditLogEvent {
  id: string;
  tenantId: string;
  env: "dev" | "prod";
  action: AuditAction;
  actorId: string;
  actorName: string;
  targetType: "KB_ENTRY" | "ESCALATION" | "CHAT_LOG" | "CONFIG" | "CREDENTIAL" | "USER";
  targetId: string;
  payload: Record<string, unknown>;
  outcome: "success" | "failure";
  createdAt: string;
}

const tenantContexts: Record<string, TenantContext> = {
  "realx-dev": {
    tenantId: "realx",
    env: "dev",
    org: { id: "realx", name: "RealX" },
    teams: [
      { id: "ops", name: "Ops" },
      { id: "support", name: "Support" },
    ],
    currentUser: { id: "u_001", name: "Arpit", role: "SuperAdmin" },
  },
  "realx-prod": {
    tenantId: "realx",
    env: "prod",
    org: { id: "realx", name: "RealX" },
    teams: [
      { id: "ops", name: "Ops" },
      { id: "support", name: "Support" },
    ],
    currentUser: { id: "u_001", name: "Arpit", role: "SuperAdmin" },
  },
};

export function getTenantContext(tenantId: string, env: string): TenantContext | null {
  return tenantContexts[`${tenantId}-${env}`] ?? null;
}

// Route metadata for future guards
export const routeMetadata: Record<string, { allowedRoles: Role[] }> = {
  overview: { allowedRoles: ["SuperAdmin", "OpsManager", "KnowledgeManager", "SupportAgent", "Auditor"] },
  train: { allowedRoles: ["SuperAdmin", "OpsManager", "KnowledgeManager"] },
  monitoring: { allowedRoles: ["SuperAdmin", "OpsManager", "Auditor"] },
  "chat-logs": { allowedRoles: ["SuperAdmin", "OpsManager", "KnowledgeManager", "SupportAgent", "Auditor"] },
  escalations: { allowedRoles: ["SuperAdmin", "OpsManager", "SupportAgent", "KnowledgeManager", "Auditor"] },
  feedback: { allowedRoles: ["SuperAdmin", "OpsManager", "KnowledgeManager", "SupportAgent"] },
  configuration: { allowedRoles: ["SuperAdmin", "OpsManager"] },
  integrations: { allowedRoles: ["SuperAdmin", "OpsManager"] },
  users: { allowedRoles: ["SuperAdmin"] },
  audit: { allowedRoles: ["SuperAdmin", "OpsManager", "Auditor"] },
};
