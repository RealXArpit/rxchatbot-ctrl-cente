// ── Chat endpoint ──────────────────────────────────────────
export interface ChatRequest {
  channel: "WEBSITE" | "WHATSAPP" | "API" | "ADMIN_TEST";
  userId: string;
  sessionId: string;
  userMessage: string;
  metadata?: Record<string, unknown>;
}

export interface ChatResponse {
  answer: string;
  routedTo: "BOT" | "HUMAN";
  confidence: number;
  cacheHit: boolean;
  citations: string[];
  sessionId: string;
  logId: string;
  timestamp: string;
  escalationReason?: string | null;
  suggestedFollowUp?: string | null;
  tokensUsed?: number;
}

// ── Feedback endpoint ──────────────────────────────────────
export interface FeedbackRequest {
  logId: string;
  feedback: 1 | -1;
  userId?: string;
}

export interface FeedbackResponse {
  success: boolean;
}

// ── Agent intervention endpoint ────────────────────────────
export interface AgentInterventionRequest {
  sessionId: string;
  agentId: string;
  agentMessage: string;
  operation: "REPLY" | "TAKEOVER" | "RESOLVE" | "END_TAKEOVER";
  resolutionNote?: string;
  ticketId?: string;
}

export interface AgentInterventionResponse {
  success: boolean;
  operation: string;
}

// ── Admin training endpoint ────────────────────────────────
export type AdminOperation =
  | "ADD_REFERENCE_ANSWER"
  | "ADD_KB_ENTRY"
  | "UPDATE_KB_ENTRY"
  | "DEPRECATE_KB_ENTRY"
  | "APPROVE_FROM_ESCALATION";

export interface AdminRequest {
  operation: AdminOperation;
  logId?: string;
  kbId?: string;
  referenceAnswer?: string;
  reviewerId?: string;
  category?: string;
  question?: string;
  answer?: string;
  keywords?: string;
}

export interface AdminResponse {
  success: boolean;
  operation: AdminOperation;
}

// ── Agent poll endpoint ────────────────────────────────────
export interface AgentMessage {
  id: string;
  session_id: string;
  agent_id: string;
  agent_message: string;
  intervention_type: "REPLY" | "TAKEOVER" | "RESOLVE";
  timestamp: string;
}
