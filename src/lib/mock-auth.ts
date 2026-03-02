// Mock auth API layer

import type { Role, AuditLogEvent } from "./mock-api";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
}

export interface MfaStatus {
  required: boolean;
  method: "totp";
  verified: boolean;
}

export interface AuthSession {
  sessionId: string;
  tenantId: string;
  user: MockUser;
  mfa: MfaStatus;
}

// Roles that require MFA
const MFA_REQUIRED_ROLES: Role[] = ["SuperAdmin", "OpsManager"];

const mockUsers: MockUser[] = [
  { id: "u_001", name: "Arpit", email: "arpit@realx.in", role: "SuperAdmin", tenantId: "realx" },
  { id: "u_002", name: "Ops Manager", email: "ops@realx.in", role: "OpsManager", tenantId: "realx" },
  { id: "u_003", name: "KB Manager", email: "kb@realx.in", role: "KnowledgeManager", tenantId: "realx" },
  { id: "u_004", name: "Support Agent", email: "agent@realx.in", role: "SupportAgent", tenantId: "realx" },
  { id: "u_005", name: "Auditor", email: "audit@realx.in", role: "Auditor", tenantId: "realx" },
];

// In-memory audit log
export const auditLog: AuditLogEvent[] = [];

let currentSession: AuthSession | null = null;

function addAuditEvent(action: string, actorId: string) {
  auditLog.push({
    id: `evt_${Date.now()}`,
    tenantId: "realx",
    env: "dev",
    action,
    actorId,
    createdAt: new Date().toISOString(),
  });
}

export function mockLogin(email: string, password: string, tenantId: string): { ok: boolean; session?: AuthSession; error?: string } {
  if (!password) return { ok: false, error: "Password is required." };
  if (tenantId !== "realx") return { ok: false, error: "Unknown tenant." };

  const user = mockUsers.find((u) => u.email === email && u.tenantId === tenantId);
  if (!user) return { ok: false, error: "Invalid email or password." };

  const session: AuthSession = {
    sessionId: `sess_${Date.now()}`,
    tenantId,
    user,
    mfa: {
      required: MFA_REQUIRED_ROLES.includes(user.role),
      method: "totp",
      verified: false,
    },
  };

  currentSession = session;
  addAuditEvent("AUTH_LOGIN", user.id);
  return { ok: true, session };
}

export function mockLogout(): { ok: true } {
  if (currentSession) {
    addAuditEvent("AUTH_LOGOUT", currentSession.user.id);
  }
  currentSession = null;
  return { ok: true };
}

export function mockGetSession(): AuthSession | null {
  return currentSession;
}

export function mockVerifyMfa(): boolean {
  if (currentSession) {
    currentSession = { ...currentSession, mfa: { ...currentSession.mfa, verified: true } };
    return true;
  }
  return false;
}

export function getMockUsers(): MockUser[] {
  return mockUsers;
}
