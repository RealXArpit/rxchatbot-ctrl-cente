export interface TestChatMessage {
  id: string;
  role: "user" | "bot" | "error";
  text: string;
  sentAt: string;
  meta?: {
    logId: string;
    routedTo: "BOT" | "HUMAN";
    confidence: number;
    cacheHit: boolean;
    citations: string[];
    sessionId: string;
    tokensUsed?: number;
    escalationReason?: string | null;
    suggestedFollowUp?: string | null;
  };
  feedback?: 1 | -1 | null;
  isLoading?: boolean;
}

export interface TestChatSession {
  sessionId: string;
  env: "dev" | "prod";
  messages: TestChatMessage[];
  startedAt: string;
}
