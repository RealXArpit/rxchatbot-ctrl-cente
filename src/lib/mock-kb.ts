import { auditLog } from "./mock-auth";

export type KbStatus = "Draft" | "Proposed" | "Approved" | "Published" | "Archived";

export interface KnowledgeBaseItem {
  id: string;
  tenantId: string;
  env: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  sourceUrl: string;
  lastUpdated: string;
  status: KbStatus;
  createdAt: string;
  updatedAt: string;
  versions: KbVersion[];
  adminReferenceAnswer: string | null;
  adminReviewedAt: string | null;
  adminReviewerId: string | null;
  n8nSyncedAt: string | null;
  n8nSyncStatus: "synced" | "pending" | "never" | "error";
}

export interface KbVersion {
  id: string;
  kbId: string;
  status: KbStatus;
  actorId: string;
  actorName: string;
  reason: string;
  createdAt: string;
}

export interface TestbenchResult {
  normalizedQuery: string;
  topMatches: { kbId: string; question: string; score: number }[];
  routedTo: "BOT" | "HUMAN";
  confidence: number;
  finalAnswer: string;
}

const CATEGORIES = ["Basics", "Investments", "Legal", "Payments", "Account"];

function makeItem(
  i: number, category: string, question: string, answer: string,
  keywords: string[], status: KbStatus, env: string
): KnowledgeBaseItem {
  const id = `kb_${String(i).padStart(3, "0")}`;
  const base = "2026-02-";
  const day = String(10 + (i % 18)).padStart(2, "0");
  return {
    id, tenantId: "realx", env, category, question, answer, keywords,
    sourceUrl: `https://realx.example/kb/${i}`,
    lastUpdated: `${base}${day}`,
    status, createdAt: `${base}${day}T10:00:00Z`, updatedAt: `${base}${day}T10:00:00Z`,
    versions: [
      { id: `v_${id}_1`, kbId: id, status: "Draft", actorId: "u_003", actorName: "KB Manager", reason: "Created", createdAt: `${base}${day}T10:00:00Z` },
      ...(status !== "Draft" ? [{ id: `v_${id}_2`, kbId: id, status: status as KbStatus, actorId: "u_001", actorName: "Arpit", reason: `Moved to ${status}`, createdAt: `${base}${day}T11:00:00Z` }] : []),
    ],
    adminReferenceAnswer: null,
    adminReviewedAt: null,
    adminReviewerId: null,
    n8nSyncedAt: null,
    n8nSyncStatus: "never",
  };
}

const seedItems: KnowledgeBaseItem[] = [
  makeItem(1, "Basics", "What is RealX?", "RealX is a platform for fractional real estate investment.", ["realx", "platform"], "Published", "dev"),
  makeItem(2, "Basics", "What is fractional ownership?", "Fractional ownership allows multiple investors to co-own a property.", ["fractional", "ownership", "rwa"], "Published", "dev"),
  makeItem(3, "Basics", "How do I get started?", "Sign up on realx.in, complete KYC, and browse available properties.", ["start", "signup", "kyc"], "Published", "dev"),
  makeItem(4, "Investments", "What is minimum investment?", "The minimum investment starts at ₹10,000 per fraction.", ["minimum", "investment", "amount"], "Published", "dev"),
  makeItem(5, "Investments", "How are returns calculated?", "Returns include rental yield and capital appreciation, distributed quarterly.", ["returns", "yield", "appreciation"], "Approved", "dev"),
  makeItem(6, "Investments", "Can I sell my fraction?", "Yes, fractions can be traded on the RealX secondary market.", ["sell", "trade", "secondary"], "Approved", "dev"),
  makeItem(7, "Legal", "Is fractional ownership legal in India?", "Yes, fractional ownership is legal under Indian property laws.", ["legal", "india", "law"], "Published", "dev"),
  makeItem(8, "Legal", "What documents do I need for KYC?", "PAN card, Aadhaar, and bank statement are required.", ["kyc", "documents", "pan", "aadhaar"], "Published", "dev"),
  makeItem(9, "Legal", "What happens if the property is sold?", "Investors receive their proportional share of the sale proceeds.", ["sale", "proceeds", "exit"], "Proposed", "dev"),
  makeItem(10, "Payments", "How do I make a payment?", "Payments can be made via UPI, bank transfer, or net banking.", ["payment", "upi", "bank"], "Published", "dev"),
  makeItem(11, "Payments", "Are there any hidden charges?", "No hidden charges. Platform fee is 2% on investments.", ["charges", "fees", "platform"], "Published", "dev"),
  makeItem(12, "Payments", "How are rental payouts distributed?", "Rental income is distributed quarterly to your registered bank account.", ["rental", "payout", "quarterly"], "Proposed", "dev"),
  makeItem(13, "Account", "How do I reset my password?", "Click 'Forgot Password' on the login page and follow the email instructions.", ["password", "reset", "login"], "Published", "dev"),
  makeItem(14, "Account", "Can I have multiple accounts?", "No, each user can have only one account per PAN number.", ["multiple", "accounts", "pan"], "Draft", "dev"),
  makeItem(15, "Account", "How do I update my bank details?", "Go to Profile > Bank Details and submit updated information with verification.", ["bank", "update", "profile"], "Draft", "dev"),
  makeItem(16, "Basics", "What properties are available?", "Commercial and residential properties across major Indian cities.", ["properties", "commercial", "residential"], "Draft", "dev"),
  makeItem(17, "Investments", "What is the lock-in period?", "There is no mandatory lock-in, but a 6-month holding period is recommended.", ["lockin", "holding", "period"], "Proposed", "dev"),
  makeItem(18, "Legal", "How is tax handled?", "Rental income is taxable as per your income tax slab. TDS is deducted.", ["tax", "tds", "income"], "Draft", "dev"),
  makeItem(19, "Payments", "Can I get a refund?", "Refunds are processed within 7 business days for cancelled investments.", ["refund", "cancel", "return"], "Approved", "dev"),
  makeItem(20, "Account", "How do I delete my account?", "Contact support@realx.in to request account deletion.", ["delete", "account", "support"], "Draft", "dev"),
];

let items = structuredClone(seedItems);

function addAudit(action: string, actorId: string, env: string) {
  auditLog.push({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    tenantId: "realx", env, action, actorId,
    createdAt: new Date().toISOString(),
  });
}

// --- API ---

export interface KbFilters {
  q?: string;
  status?: KbStatus;
  category?: string;
}

export function getKbItems(env: string, filters?: KbFilters): KnowledgeBaseItem[] {
  let result = items.filter((i) => i.env === env);
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    result = result.filter((i) => i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q) || i.keywords.some((k) => k.includes(q)));
  }
  if (filters?.status) result = result.filter((i) => i.status === filters.status);
  if (filters?.category) result = result.filter((i) => i.category === filters.category);
  result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return result;
}

export function getKbById(kbId: string): KnowledgeBaseItem | null {
  return items.find((i) => i.id === kbId) ?? null;
}

export function createKbItem(env: string, data: { category: string; question: string; answer: string; keywords: string[]; sourceUrl: string }, actorId: string, actorName: string): KnowledgeBaseItem {
  const now = new Date().toISOString();
  const id = `kb_${String(items.length + 1).padStart(3, "0")}`;
  const item: KnowledgeBaseItem = {
    id, tenantId: "realx", env, ...data,
    lastUpdated: now.slice(0, 10), status: "Draft",
    createdAt: now, updatedAt: now,
    versions: [{ id: `v_${id}_1`, kbId: id, status: "Draft", actorId, actorName, reason: "Created", createdAt: now }],
  };
  items.push(item);
  addAudit("KB_CREATE", actorId, env);
  return item;
}

export function updateKbItem(kbId: string, data: Partial<Pick<KnowledgeBaseItem, "category" | "question" | "answer" | "keywords" | "sourceUrl">>, actorId: string): KnowledgeBaseItem | null {
  const item = items.find((i) => i.id === kbId);
  if (!item) return null;
  Object.assign(item, data, { updatedAt: new Date().toISOString(), lastUpdated: new Date().toISOString().slice(0, 10) });
  addAudit("KB_UPDATE", actorId, item.env);
  return structuredClone(item);
}

function transitionStatus(kbId: string, newStatus: KbStatus, actorId: string, actorName: string, reason: string): KnowledgeBaseItem | null {
  const item = items.find((i) => i.id === kbId);
  if (!item) return null;
  const now = new Date().toISOString();
  item.status = newStatus;
  item.updatedAt = now;
  item.lastUpdated = now.slice(0, 10);
  item.versions.push({ id: `v_${kbId}_${item.versions.length + 1}`, kbId, status: newStatus, actorId, actorName, reason, createdAt: now });
  addAudit(`KB_${newStatus.toUpperCase()}`, actorId, item.env);
  return structuredClone(item);
}

export function proposeKbItem(kbId: string, actorId: string, actorName: string, reason: string) {
  return transitionStatus(kbId, "Proposed", actorId, actorName, reason);
}
export function approveKbItem(kbId: string, actorId: string, actorName: string, reason: string) {
  return transitionStatus(kbId, "Approved", actorId, actorName, reason);
}
export function publishKbItem(kbId: string, actorId: string, actorName: string, reason: string) {
  return transitionStatus(kbId, "Published", actorId, actorName, reason);
}
export function archiveKbItem(kbId: string, actorId: string, actorName: string, reason: string) {
  return transitionStatus(kbId, "Archived", actorId, actorName, reason);
}

export function getKbCategories(): string[] {
  return CATEGORIES;
}

// --- Testbench ---

export function runTestbench(env: string, query: string, threshold: number): TestbenchResult {
  const q = query.toLowerCase().trim();
  const published = items.filter((i) => i.env === env && i.status === "Published");

  const scored = published.map((item) => {
    const qWords = q.split(/\s+/);
    const matchedKeywords = item.keywords.filter((k) => qWords.some((w) => k.includes(w) || w.includes(k)));
    const questionMatch = item.question.toLowerCase().includes(q) ? 0.4 : 0;
    const keywordScore = Math.min(matchedKeywords.length * 0.2, 0.5);
    const score = Math.min(questionMatch + keywordScore + 0.08, 1);
    return { kbId: item.id, question: item.question, score: Math.round(score * 100) / 100 };
  }).sort((a, b) => b.score - a.score);

  const topMatches = scored.filter((s) => s.score > 0.1).slice(0, 5);
  const bestScore = topMatches[0]?.score ?? 0;
  const routedTo = bestScore >= threshold ? "BOT" : "HUMAN";
  const bestItem = published.find((i) => i.id === topMatches[0]?.kbId);

  return {
    normalizedQuery: q,
    topMatches,
    routedTo,
    confidence: bestScore,
    finalAnswer: bestScore >= threshold && bestItem
      ? `${bestItem.answer}\n\nSources: ${bestItem.id}`
      : "No confident match found. Routing to human agent.",
  };
}
