import type { Conversation } from "./mock-conversations";

export interface FeedbackEvent {
  id: string;
  logId: string;
  sessionId: string;
  userMessage: string;
  botAnswer: string;
  feedback: 1 | -1;
  feedbackAt: string;
  channel: string;
  routedTo: "BOT" | "HUMAN";
  confidence: number;
  citations: string[];
}

export interface KbFeedbackScore {
  kbId: string;
  question: string;
  category: string;
  feedbackScore: number;
  useCount: number;
}

export interface FeedbackSummary {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  satisfactionRate: number;
  avgConfidenceOnPositive: number;
}

const userMessages = [
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
];

function seedFeedbackEvents(): FeedbackEvent[] {
  const events: FeedbackEvent[] = [];
  const base = new Date("2026-02-15");
  for (let i = 0; i < 40; i++) {
    const isPositive = i % 3 !== 0; // ~67% positive
    const d = new Date(base.getTime() + i * 3600000 * 6);
    events.push({
      id: `fe_${1000 + i}`,
      logId: crypto.randomUUID(),
      sessionId: `web_dev_${(2000 + i).toString(36)}`,
      userMessage: userMessages[i % userMessages.length],
      botAnswer: botAnswers[i % botAnswers.length],
      feedback: isPositive ? 1 : -1,
      feedbackAt: d.toISOString(),
      channel: "WEBSITE",
      routedTo: i % 5 === 0 ? "HUMAN" : "BOT",
      confidence: 0.5 + Math.random() * 0.5,
      citations: i % 2 === 0 ? [`KB#${(i % 10) + 1}`] : [],
    });
  }
  events.sort((a, b) => new Date(b.feedbackAt).getTime() - new Date(a.feedbackAt).getTime());
  return events;
}

function seedKbScores(): KbFeedbackScore[] {
  const questions = [
    { kbId: "kb_001", question: "What is RealX?", category: "Basics" },
    { kbId: "kb_002", question: "What is fractional ownership?", category: "Basics" },
    { kbId: "kb_003", question: "How do I get started?", category: "Basics" },
    { kbId: "kb_004", question: "What is minimum investment?", category: "Investments" },
    { kbId: "kb_005", question: "How are returns calculated?", category: "Investments" },
    { kbId: "kb_006", question: "Is RealX regulated?", category: "Legal" },
    { kbId: "kb_007", question: "What documents are needed?", category: "Legal" },
    { kbId: "kb_008", question: "How do payments work?", category: "Payments" },
    { kbId: "kb_009", question: "What is the lock-in period?", category: "Investments" },
    { kbId: "kb_010", question: "How to exit an investment?", category: "Investments" },
  ];
  return questions.map((q, i) => ({
    ...q,
    feedbackScore: i < 5 ? 0.7 + Math.random() * 0.3 : 0.2 + Math.random() * 0.4,
    useCount: 10 + Math.floor(Math.random() * 50),
  }));
}

let cachedEvents: FeedbackEvent[] | null = null;
let cachedScores: KbFeedbackScore[] | null = null;

export function getFeedbackEvents(): FeedbackEvent[] {
  if (!cachedEvents) cachedEvents = seedFeedbackEvents();
  return cachedEvents;
}

export function getKbFeedbackScores(): KbFeedbackScore[] {
  if (!cachedScores) cachedScores = seedKbScores();
  return cachedScores;
}

export function getFeedbackSummary(): FeedbackSummary {
  const events = getFeedbackEvents();
  const pos = events.filter((e) => e.feedback === 1);
  const neg = events.filter((e) => e.feedback === -1);
  const avgConf = pos.length ? pos.reduce((s, e) => s + e.confidence, 0) / pos.length : 0;
  return {
    totalFeedback: events.length,
    positiveCount: pos.length,
    negativeCount: neg.length,
    satisfactionRate: events.length ? pos.length / events.length : 0,
    avgConfidenceOnPositive: avgConf,
  };
}
