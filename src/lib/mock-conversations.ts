// Mock conversations data & API

export interface Conversation {
  id: string;
  tenantId: string;
  env: string;
  channel: "WEBSITE" | "WHATSAPP" | "API";
  sessionId: string;
  userIdHash: string;
  startedAt: string;
  endedAt: string | null;
  routedTo: "BOT" | "HUMAN";
  confidence: number;
  cacheHit: boolean;
  citations: string[];
  escalationReason: string | null;
  legalHold: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "bot" | "agent" | "system";
  text: string;
  textRedacted: string;
  createdAt: string;
  piiRedacted: boolean;
}

export interface CacheEntry {
  id: string;
  cacheKey: string;
  answer: string;
  cachedAt: string;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
  cacheEntry: CacheEntry | null;
}

export interface ConversationFilters {
  q?: string;
  channel?: string;
  routedTo?: string;
  confidenceBand?: "high" | "medium" | "low";
  cacheHit?: boolean | null;
  dateFrom?: string;
  dateTo?: string;
}

// ── Seed helpers ──

const userQuestions = [
  "What is fractional ownership?",
  "How do I invest in a property?",
  "What are the tax implications?",
  "Can I sell my tokens?",
  "What is the minimum investment?",
  "How are dividends distributed?",
  "Is this regulated by SEBI?",
  "How do I verify property documents?",
  "What happens if the property is sold?",
  "Can I invest from outside India?",
  "What is the lock-in period?",
  "How are rental yields calculated?",
  "What is the exit strategy?",
  "How do I track my portfolio?",
  "What is the difference between FRAX and equity?",
];

const botAnswers = [
  "Fractional ownership allows multiple investors to own a share of a property through tokenized assets.",
  "You can invest by selecting a property on our platform, completing KYC, and purchasing tokens.",
  "Tax implications vary by jurisdiction. In India, rental income is taxed as per your slab rate.",
  "Yes, tokens can be sold on the secondary marketplace once the lock-in period expires.",
  "The minimum investment starts at ₹10,000 depending on the property.",
  "Dividends are distributed quarterly based on rental income proportional to your token holdings.",
  "Yes, RealX operates under RERA and follows SEBI guidelines for asset tokenization.",
  "All property documents are verified by our legal team and available in the document vault.",
  "Proceeds from property sale are distributed proportionally to all token holders.",
  "Yes, NRI investments are supported with additional documentation requirements.",
  "The lock-in period varies per property, typically 12-36 months.",
  "Rental yields are calculated as annual rental income divided by property valuation.",
  "You can exit by selling tokens on the secondary market or during property liquidation events.",
  "Your portfolio dashboard shows real-time token values, yields, and transaction history.",
  "FRAX tokens represent fractional property ownership, while equity represents company shares.",
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateConversations(env: string): Conversation[] {
  const count = 32;
  const convs: Conversation[] = [];
  const startRange = new Date("2026-01-15");
  const endRange = new Date("2026-02-28");

  for (let i = 0; i < count; i++) {
    const started = randomDate(startRange, endRange);
    const duration = 30000 + Math.random() * 300000; // 30s to 5min
    const conf = i < 5 ? 0.3 + Math.random() * 0.2 : // first 5 = low confidence
                 i < 15 ? 0.55 + Math.random() * 0.17 : // next 10 = medium
                 0.72 + Math.random() * 0.28; // rest = high
    const isBot = conf > 0.55 && Math.random() > 0.2;
    const isLegal = i === 7 || i === 19;

    convs.push({
      id: `c_${1001 + i}`,
      tenantId: "realx",
      env,
      channel: "WEBSITE",
      sessionId: `web_${env}_${(1000 + i).toString(36)}`,
      userIdHash: `u_hash_${(200 + i).toString(16)}`,
      startedAt: started.toISOString(),
      endedAt: new Date(started.getTime() + duration).toISOString(),
      routedTo: isBot ? "BOT" : "HUMAN",
      confidence: Math.round(conf * 100) / 100,
      cacheHit: isBot && Math.random() > 0.5,
      citations: isBot ? [`KB#${Math.ceil(Math.random() * 10)}`] : [],
      escalationReason: !isBot ? "Low confidence or user request" : null,
      legalHold: isLegal,
    });
  }

  // Sort by startedAt descending
  convs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  return convs;
}

function generateMessages(conv: Conversation, index: number): Message[] {
  const msgs: Message[] = [];
  const qIdx = index % userQuestions.length;
  const userQ = userQuestions[qIdx];
  const botA = botAnswers[qIdx];
  const base = new Date(conv.startedAt);
  const userName = `User ${conv.userIdHash.slice(-4)}`;

  msgs.push({
    id: `${conv.id}_m1`,
    conversationId: conv.id,
    role: "system",
    text: `Conversation started on ${conv.channel} channel`,
    textRedacted: `Conversation started on ${conv.channel} channel`,
    createdAt: base.toISOString(),
    piiRedacted: false,
  });

  msgs.push({
    id: `${conv.id}_m2`,
    conversationId: conv.id,
    role: "user",
    text: `${userName}: ${userQ}`,
    textRedacted: `[REDACTED]: ${userQ}`,
    createdAt: new Date(base.getTime() + 5000).toISOString(),
    piiRedacted: true,
  });

  msgs.push({
    id: `${conv.id}_m3`,
    conversationId: conv.id,
    role: "bot",
    text: botA,
    textRedacted: botA,
    createdAt: new Date(base.getTime() + 10000).toISOString(),
    piiRedacted: false,
  });

  if (conv.routedTo === "HUMAN") {
    msgs.push({
      id: `${conv.id}_m4`,
      conversationId: conv.id,
      role: "system",
      text: "Escalated to human agent",
      textRedacted: "Escalated to human agent",
      createdAt: new Date(base.getTime() + 15000).toISOString(),
      piiRedacted: false,
    });
    msgs.push({
      id: `${conv.id}_m5`,
      conversationId: conv.id,
      role: "agent",
      text: `Hi, I'm taking over this conversation. Let me help you with your query about "${userQ.toLowerCase()}".`,
      textRedacted: `Hi, I'm taking over this conversation. Let me help you with your query.`,
      createdAt: new Date(base.getTime() + 45000).toISOString(),
      piiRedacted: false,
    });
  }

  if (conv.cacheHit) {
    msgs.push({
      id: `${conv.id}_m_cache`,
      conversationId: conv.id,
      role: "system",
      text: `Cache hit: response served from cache (key: ${conv.channel}::${userQ.toLowerCase()})`,
      textRedacted: `Cache hit: response served from cache`,
      createdAt: new Date(base.getTime() + 9000).toISOString(),
      piiRedacted: false,
    });
  }

  msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return msgs;
}

// ── Caches ──

const conversationsCache: Record<string, Conversation[]> = {};
const messagesCache: Record<string, Message[]> = {};

function ensureData(env: string) {
  if (!conversationsCache[env]) {
    const convs = generateConversations(env);
    conversationsCache[env] = convs;
    convs.forEach((c, i) => {
      messagesCache[c.id] = generateMessages(c, i);
    });
  }
}

// ── Public API ──

export function getConversations(
  env: string,
  filters: ConversationFilters = {},
  page = 1,
  pageSize = 25
): { items: Conversation[]; page: number; pageSize: number; total: number } {
  ensureData(env);
  let items = [...conversationsCache[env]];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    items = items.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.sessionId.toLowerCase().includes(q) ||
        c.userIdHash.toLowerCase().includes(q)
    );
  }
  if (filters.channel) {
    items = items.filter((c) => c.channel === filters.channel);
  }
  if (filters.routedTo) {
    items = items.filter((c) => c.routedTo === filters.routedTo);
  }
  if (filters.confidenceBand) {
    items = items.filter((c) => {
      if (filters.confidenceBand === "high") return c.confidence >= 0.72;
      if (filters.confidenceBand === "medium") return c.confidence >= 0.55 && c.confidence < 0.72;
      return c.confidence < 0.55;
    });
  }
  if (filters.cacheHit !== undefined && filters.cacheHit !== null) {
    items = items.filter((c) => c.cacheHit === filters.cacheHit);
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    items = items.filter((c) => new Date(c.startedAt) >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    items = items.filter((c) => new Date(c.startedAt) <= to);
  }

  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, total };
}

export function getConversationDetail(env: string, conversationId: string): ConversationDetail | null {
  ensureData(env);
  const conv = conversationsCache[env]?.find((c) => c.id === conversationId);
  if (!conv) return null;

  const messages = messagesCache[conversationId] ?? [];
  const cacheEntry: CacheEntry | null = conv.cacheHit
    ? {
        id: `ce_${conversationId}`,
        cacheKey: `${conv.channel}::${userQuestions[parseInt(conversationId.replace("c_", "")) % userQuestions.length]?.toLowerCase()}`,
        answer: botAnswers[parseInt(conversationId.replace("c_", "")) % botAnswers.length],
        cachedAt: new Date(new Date(conv.startedAt).getTime() - 3600000).toISOString(),
      }
    : null;

  return { conversation: conv, messages, cacheEntry };
}

export type ColumnKey =
  | "id"
  | "channel"
  | "startedAt"
  | "routedTo"
  | "confidence"
  | "cacheHit"
  | "citations"
  | "legalHold"
  | "escalationReason";

export const ALL_COLUMNS: { key: ColumnKey; label: string; defaultVisible: boolean }[] = [
  { key: "id", label: "Conversation ID", defaultVisible: true },
  { key: "channel", label: "Channel", defaultVisible: true },
  { key: "startedAt", label: "Started", defaultVisible: true },
  { key: "routedTo", label: "Routed To", defaultVisible: true },
  { key: "confidence", label: "Confidence", defaultVisible: true },
  { key: "cacheHit", label: "Cache Hit", defaultVisible: true },
  { key: "citations", label: "Citations", defaultVisible: false },
  { key: "legalHold", label: "Legal Hold", defaultVisible: false },
  { key: "escalationReason", label: "Escalation Reason", defaultVisible: false },
];
