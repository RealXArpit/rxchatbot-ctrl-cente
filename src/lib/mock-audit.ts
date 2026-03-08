import type { AuditLogEvent, AuditAction } from "./mock-api";

// In-memory audit log store
export const auditLog: AuditLogEvent[] = [];

export function appendAuditEvent(evt: {
  action: AuditAction;
  actorId: string;
  actorName: string;
  targetType: AuditLogEvent["targetType"];
  targetId: string;
  payload: Record<string, unknown>;
  outcome: "success" | "failure";
  env?: "dev" | "prod";
}) {
  auditLog.push({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    tenantId: "realx",
    env: evt.env ?? "dev",
    action: evt.action,
    actorId: evt.actorId,
    actorName: evt.actorName,
    targetType: evt.targetType,
    targetId: evt.targetId,
    payload: evt.payload,
    outcome: evt.outcome,
    createdAt: new Date().toISOString(),
  });
}

// Seed data
function seed() {
  const actors = [
    { id: "u_001", name: "Arpit" },
    { id: "u_002", name: "Ops Manager" },
    { id: "u_003", name: "KB Manager" },
    { id: "u_004", name: "Support Agent" },
    { id: "u_005", name: "Auditor" },
  ];

  const seedEvents: Omit<AuditLogEvent, "id" | "tenantId">[] = [
    { env: "dev", action: "USER_LOGIN", actorId: "u_001", actorName: "Arpit", targetType: "USER", targetId: "u_001", payload: { method: "password" }, outcome: "success", createdAt: "2025-06-01T08:00:00Z" },
    { env: "dev", action: "KB_PUSH", actorId: "u_003", actorName: "KB Manager", targetType: "KB_ENTRY", targetId: "kb_001", payload: { operation: "UPDATE_KB_ENTRY", category: "General", question: "What is RealX?", answer: "RealX is a real estate platform." }, outcome: "success", createdAt: "2025-06-01T09:15:00Z" },
    { env: "dev", action: "KB_PUSH", actorId: "u_001", actorName: "Arpit", targetType: "KB_ENTRY", targetId: "kb_003", payload: { operation: "ADD_KB_ENTRY", category: "Payments", question: "How do I pay?", answer: "Via UPI or bank transfer." }, outcome: "success", createdAt: "2025-06-01T10:30:00Z" },
    { env: "dev", action: "AGENT_TAKEOVER", actorId: "u_004", actorName: "Support Agent", targetType: "ESCALATION", targetId: "esc_001", payload: { reason: "Customer requested human" }, outcome: "success", createdAt: "2025-06-01T11:00:00Z" },
    { env: "dev", action: "AGENT_REPLY", actorId: "u_004", actorName: "Support Agent", targetType: "ESCALATION", targetId: "esc_001", payload: { message: "Hi, I'm here to help." }, outcome: "success", createdAt: "2025-06-01T11:05:00Z" },
    { env: "dev", action: "AGENT_RESOLVE", actorId: "u_004", actorName: "Support Agent", targetType: "ESCALATION", targetId: "esc_001", payload: { resolution: "Helped customer with payment query" }, outcome: "success", createdAt: "2025-06-01T11:30:00Z" },
    { env: "dev", action: "FEEDBACK_SUBMIT", actorId: "u_002", actorName: "Ops Manager", targetType: "CHAT_LOG", targetId: "log_042", payload: { feedback: 1, comment: "Good response" }, outcome: "success", createdAt: "2025-06-02T09:00:00Z" },
    { env: "dev", action: "CONFIG_PROPOSE", actorId: "u_001", actorName: "Arpit", targetType: "CONFIG", targetId: "cfg_routing", payload: { field: "confidenceThreshold", oldValue: 0.7, newValue: 0.75 }, outcome: "success", createdAt: "2025-06-02T10:00:00Z" },
    { env: "dev", action: "CONFIG_APPROVE", actorId: "u_002", actorName: "Ops Manager", targetType: "CONFIG", targetId: "cfg_routing", payload: { approvedBy: "u_002" }, outcome: "success", createdAt: "2025-06-02T10:30:00Z" },
    { env: "dev", action: "CONFIG_PUBLISH", actorId: "u_001", actorName: "Arpit", targetType: "CONFIG", targetId: "cfg_routing", payload: { version: "v2.1" }, outcome: "success", createdAt: "2025-06-02T11:00:00Z" },
    { env: "dev", action: "KB_DEPRECATE", actorId: "u_002", actorName: "Ops Manager", targetType: "KB_ENTRY", targetId: "kb_005", payload: { reason: "Outdated information" }, outcome: "success", createdAt: "2025-06-03T08:00:00Z" },
    { env: "dev", action: "KB_PUSH", actorId: "u_003", actorName: "KB Manager", targetType: "KB_ENTRY", targetId: "kb_002", payload: { operation: "UPDATE_KB_ENTRY", category: "Pricing" }, outcome: "failure", createdAt: "2025-06-03T09:00:00Z" },
    { env: "dev", action: "CONFIG_ROLLBACK", actorId: "u_001", actorName: "Arpit", targetType: "CONFIG", targetId: "cfg_routing", payload: { rolledBackTo: "v2.0" }, outcome: "success", createdAt: "2025-06-03T14:00:00Z" },
    { env: "dev", action: "USER_LOGIN", actorId: "u_005", actorName: "Auditor", targetType: "USER", targetId: "u_005", payload: { method: "password" }, outcome: "success", createdAt: "2025-06-04T07:00:00Z" },
    { env: "dev", action: "USER_LOGOUT", actorId: "u_001", actorName: "Arpit", targetType: "USER", targetId: "u_001", payload: {}, outcome: "success", createdAt: "2025-06-04T18:00:00Z" },
  ];

  seedEvents.forEach((evt) => {
    auditLog.push({
      id: `evt_seed_${Math.random().toString(36).slice(2, 8)}`,
      tenantId: "realx",
      ...evt,
    });
  });
}

seed();

export function getAuditLog(): AuditLogEvent[] {
  return [...auditLog].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
