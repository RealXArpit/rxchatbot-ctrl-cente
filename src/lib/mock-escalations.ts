import type { AuditLogEvent } from "./mock-api";

export type Priority = "P0" | "P1" | "P2";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type EscalationReason = "LOW_CONFIDENCE" | "USER_REQUEST" | "POLICY_VIOLATION" | "TIMEOUT";

export interface SlaPolicy {
  firstResponseMinutes: number;
  resolutionHours: number;
}

export interface InternalNote {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  text: string;
  visibility: "internal";
  createdAt: string;
}

export interface AgentReply {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface EscalationTicket {
  id: string;
  tenantId: string;
  env: string;
  priority: Priority;
  status: TicketStatus;
  channel: string;
  conversationId: string;
  sessionId: string;
  escalatedAt: string;
  firstAgentReplyAt: string | null;
  resolvedAt: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  reason: EscalationReason;
  sla: SlaPolicy;
  resolutionNote: string | null;
  outcome: string | null;
  notes: InternalNote[];
  replies: AgentReply[];
}

const SLA_MAP: Record<Priority, SlaPolicy> = {
  P0: { firstResponseMinutes: 5, resolutionHours: 2 },
  P1: { firstResponseMinutes: 15, resolutionHours: 6 },
  P2: { firstResponseMinutes: 60, resolutionHours: 24 },
};

const now = new Date("2026-02-28T11:00:00Z");

function minutesAgo(m: number): string {
  return new Date(now.getTime() - m * 60000).toISOString();
}

const seedTickets: EscalationTicket[] = [
  // 2 P0 tickets - one breached
  {
    id: "t_2001", tenantId: "realx", env: "dev", priority: "P0", status: "OPEN",
    channel: "WEBSITE", conversationId: "c_1009", escalatedAt: minutesAgo(45),
    firstAgentReplyAt: null, resolvedAt: null, assigneeId: null, assigneeName: null,
    reason: "LOW_CONFIDENCE", sla: SLA_MAP.P0, resolutionNote: null, outcome: null,
    notes: [], replies: [],
  },
  {
    id: "t_2002", tenantId: "realx", env: "dev", priority: "P0", status: "IN_PROGRESS",
    channel: "WEBSITE", conversationId: "c_1010", escalatedAt: minutesAgo(120),
    firstAgentReplyAt: minutesAgo(115), resolvedAt: null,
    assigneeId: "u_004", assigneeName: "Support Agent",
    reason: "POLICY_VIOLATION", sla: SLA_MAP.P0, resolutionNote: null, outcome: null,
    notes: [{ id: "n_1", ticketId: "t_2002", authorId: "u_004", authorName: "Support Agent", text: "Investigating policy issue.", visibility: "internal", createdAt: minutesAgo(110) }],
    replies: [{ id: "r_1", ticketId: "t_2002", authorId: "u_004", authorName: "Support Agent", text: "We're looking into this right away.", createdAt: minutesAgo(115) }],
  },
  // 4 P1 tickets
  {
    id: "t_2003", tenantId: "realx", env: "dev", priority: "P1", status: "OPEN",
    channel: "WEBSITE", conversationId: "c_1011", escalatedAt: minutesAgo(30),
    firstAgentReplyAt: null, resolvedAt: null, assigneeId: null, assigneeName: null,
    reason: "LOW_CONFIDENCE", sla: SLA_MAP.P1, resolutionNote: null, outcome: null,
    notes: [], replies: [],
  },
  {
    id: "t_2004", tenantId: "realx", env: "dev", priority: "P1", status: "IN_PROGRESS",
    channel: "WEBSITE", conversationId: "c_1012", escalatedAt: minutesAgo(60),
    firstAgentReplyAt: minutesAgo(50), resolvedAt: null,
    assigneeId: "u_004", assigneeName: "Support Agent",
    reason: "USER_REQUEST", sla: SLA_MAP.P1, resolutionNote: null, outcome: null,
    notes: [{ id: "n_2", ticketId: "t_2004", authorId: "u_004", authorName: "Support Agent", text: "User wants human assistance.", visibility: "internal", createdAt: minutesAgo(48) }],
    replies: [],
  },
  {
    id: "t_2005", tenantId: "realx", env: "dev", priority: "P1", status: "OPEN",
    channel: "WEBSITE", conversationId: "c_1013", escalatedAt: minutesAgo(20),
    firstAgentReplyAt: null, resolvedAt: null,
    assigneeId: "u_002", assigneeName: "Ops Manager",
    reason: "TIMEOUT", sla: SLA_MAP.P1, resolutionNote: null, outcome: null,
    notes: [], replies: [],
  },
  {
    id: "t_2006", tenantId: "realx", env: "dev", priority: "P1", status: "RESOLVED",
    channel: "WEBSITE", conversationId: "c_1014", escalatedAt: minutesAgo(180),
    firstAgentReplyAt: minutesAgo(170), resolvedAt: minutesAgo(90),
    assigneeId: "u_004", assigneeName: "Support Agent",
    reason: "LOW_CONFIDENCE", sla: SLA_MAP.P1, resolutionNote: "Explained the process to the user.", outcome: "RESOLVED",
    notes: [], replies: [],
  },
  // 4 P2 tickets
  {
    id: "t_2007", tenantId: "realx", env: "dev", priority: "P2", status: "OPEN",
    channel: "WEBSITE", conversationId: "c_1015", escalatedAt: minutesAgo(10),
    firstAgentReplyAt: null, resolvedAt: null, assigneeId: null, assigneeName: null,
    reason: "USER_REQUEST", sla: SLA_MAP.P2, resolutionNote: null, outcome: null,
    notes: [], replies: [],
  },
  {
    id: "t_2008", tenantId: "realx", env: "dev", priority: "P2", status: "IN_PROGRESS",
    channel: "WEBSITE", conversationId: "c_1016", escalatedAt: minutesAgo(300),
    firstAgentReplyAt: minutesAgo(250), resolvedAt: null,
    assigneeId: "u_004", assigneeName: "Support Agent",
    reason: "LOW_CONFIDENCE", sla: SLA_MAP.P2, resolutionNote: null, outcome: null,
    notes: [], replies: [],
  },
  {
    id: "t_2009", tenantId: "realx", env: "dev", priority: "P2", status: "OPEN",
    channel: "WEBSITE", conversationId: "c_1017", escalatedAt: minutesAgo(5),
    firstAgentReplyAt: null, resolvedAt: null, assigneeId: null, assigneeName: null,
    reason: "TIMEOUT", sla: SLA_MAP.P2, resolutionNote: null, outcome: null,
    notes: [], replies: [],
  },
  {
    id: "t_2010", tenantId: "realx", env: "dev", priority: "P2", status: "RESOLVED",
    channel: "WEBSITE", conversationId: "c_1018", escalatedAt: minutesAgo(400),
    firstAgentReplyAt: minutesAgo(380), resolvedAt: minutesAgo(200),
    assigneeId: "u_002", assigneeName: "Ops Manager",
    reason: "POLICY_VIOLATION", sla: SLA_MAP.P2, resolutionNote: "Reviewed and cleared.", outcome: "RESOLVED",
    notes: [], replies: [],
  },
];

// Mutable store
let tickets = structuredClone(seedTickets);

export function getEscalations(env: string, queue: "unassigned" | "mine" | "all", currentUserId: string): EscalationTicket[] {
  let result = tickets.filter((t) => t.env === env);
  if (queue === "unassigned") result = result.filter((t) => !t.assigneeId && t.status !== "RESOLVED" && t.status !== "CLOSED");
  else if (queue === "mine") result = result.filter((t) => t.assigneeId === currentUserId);
  // Sort by priority then escalatedAt
  const pOrder: Record<Priority, number> = { P0: 0, P1: 1, P2: 2 };
  result.sort((a, b) => pOrder[a.priority] - pOrder[b.priority] || new Date(a.escalatedAt).getTime() - new Date(b.escalatedAt).getTime());
  return result;
}

export function getEscalationById(ticketId: string): EscalationTicket | null {
  return tickets.find((t) => t.id === ticketId) ?? null;
}

export function assignTicket(ticketId: string, assigneeId: string, assigneeName: string): EscalationTicket | null {
  const t = tickets.find((t) => t.id === ticketId);
  if (!t) return null;
  t.assigneeId = assigneeId;
  t.assigneeName = assigneeName;
  if (t.status === "OPEN") t.status = "IN_PROGRESS";
  return structuredClone(t);
}

export function addNote(ticketId: string, authorId: string, authorName: string, text: string): InternalNote | null {
  const t = tickets.find((t) => t.id === ticketId);
  if (!t) return null;
  const note: InternalNote = {
    id: `n_${Date.now()}`, ticketId, authorId, authorName, text, visibility: "internal", createdAt: new Date().toISOString(),
  };
  t.notes.push(note);
  return note;
}

export function addReply(ticketId: string, authorId: string, authorName: string, text: string): AgentReply | null {
  const t = tickets.find((t) => t.id === ticketId);
  if (!t) return null;
  const reply: AgentReply = {
    id: `r_${Date.now()}`, ticketId, authorId, authorName, text, createdAt: new Date().toISOString(),
  };
  t.replies.push(reply);
  if (!t.firstAgentReplyAt) t.firstAgentReplyAt = reply.createdAt;
  return reply;
}

export function resolveTicket(ticketId: string, resolutionNote: string, outcome: string): EscalationTicket | null {
  const t = tickets.find((t) => t.id === ticketId);
  if (!t) return null;
  t.status = "RESOLVED";
  t.resolvedAt = new Date().toISOString();
  t.resolutionNote = resolutionNote;
  t.outcome = outcome;
  return structuredClone(t);
}

/** Check if SLA is breached */
export function isSlaBreached(ticket: EscalationTicket): { firstResponse: boolean; resolution: boolean } {
  const escalatedMs = new Date(ticket.escalatedAt).getTime();
  const nowMs = Date.now();

  const firstResponseBreached = !ticket.firstAgentReplyAt &&
    (nowMs - escalatedMs) > ticket.sla.firstResponseMinutes * 60000;

  const resolutionBreached = !ticket.resolvedAt &&
    (nowMs - escalatedMs) > ticket.sla.resolutionHours * 3600000;

  return { firstResponse: firstResponseBreached, resolution: resolutionBreached };
}

export function getTimeToBreachMinutes(ticket: EscalationTicket): { firstResponse: number | null; resolution: number | null } {
  const escalatedMs = new Date(ticket.escalatedAt).getTime();
  const nowMs = Date.now();

  const frDeadline = escalatedMs + ticket.sla.firstResponseMinutes * 60000;
  const resDeadline = escalatedMs + ticket.sla.resolutionHours * 3600000;

  return {
    firstResponse: ticket.firstAgentReplyAt ? null : Math.round((frDeadline - nowMs) / 60000),
    resolution: ticket.resolvedAt ? null : Math.round((resDeadline - nowMs) / 60000),
  };
}
