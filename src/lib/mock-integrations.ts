import type { EnvConfig } from "@/types/webhook";
import { getEnvConfig } from "@/lib/env-config";

export interface WebhookEndpointInfo {
  name: string;
  path: string;
  method: "POST" | "GET";
  description: string;
  status: "active" | "inactive" | "unknown";
  lastCalledAt: string | null;
}

export interface CredentialSlot {
  id: string;
  name: string;
  envVarName: string;
  type: "api_key" | "webhook_key" | "db_url";
  status: "configured" | "missing" | "unknown";
}

export interface ChannelConfig {
  channel: "WEBSITE" | "WHATSAPP" | "API";
  enabled: boolean;
  description: string;
  rateLimit: string;
}

export function getWebhookEndpoints(): WebhookEndpointInfo[] {
  return [
    { name: "Main Chat", path: "/realx-ai", method: "POST", description: "Primary chatbot endpoint — receives user messages and returns bot responses.", status: "unknown", lastCalledAt: null },
    { name: "Feedback Handler", path: "/realx-ai-feedback", method: "POST", description: "Accepts thumbs up/down feedback on bot responses.", status: "unknown", lastCalledAt: null },
    { name: "Agent Intervention", path: "/realx-ai-agent", method: "POST", description: "Allows agents to reply, takeover, or resolve user sessions.", status: "unknown", lastCalledAt: null },
    { name: "Agent Poll", path: "/realx-ai-agent-poll", method: "GET", description: "Polls for new agent messages in a session.", status: "unknown", lastCalledAt: null },
    { name: "Admin Training", path: "/realx-ai-admin", method: "POST", description: "KB entry CRUD and reference answer operations.", status: "unknown", lastCalledAt: null },
  ];
}

const placeholders = ["dev-placeholder-key", "dev-agent-placeholder", "dev-admin-placeholder", "prod-placeholder-key", "prod-agent-placeholder", "prod-admin-placeholder"];

export function getCredentialSlots(env: "dev" | "prod"): CredentialSlot[] {
  const cfg = getEnvConfig(env);
  const check = (val: string) => !placeholders.includes(val) && val.length > 0;
  const prefix = env === "dev" ? "VITE_DEV" : "VITE_PROD";
  return [
    { id: "cs_1", name: "Webhook Base URL", envVarName: `${prefix}_WEBHOOK_BASE_URL`, type: "db_url", status: check(cfg.webhookBaseUrl) && !cfg.webhookBaseUrl.includes("your-n8n") ? "configured" : "missing" },
    { id: "cs_2", name: "Chat API Key", envVarName: `${prefix}_API_KEY`, type: "api_key", status: check(cfg.apiKey) ? "configured" : "missing" },
    { id: "cs_3", name: "Agent Key", envVarName: `${prefix}_AGENT_KEY`, type: "webhook_key", status: check(cfg.agentKey) ? "configured" : "missing" },
    { id: "cs_4", name: "Admin Key", envVarName: `${prefix}_ADMIN_KEY`, type: "api_key", status: check(cfg.adminKey) ? "configured" : "missing" },
  ];
}

export function getChannelConfigs(): ChannelConfig[] {
  return [
    { channel: "WEBSITE", enabled: true, description: "Web chat widget embedded on realx.in", rateLimit: "20 msg/hr per user" },
    { channel: "WHATSAPP", enabled: false, description: "WhatsApp Business API integration (coming soon)", rateLimit: "10 msg/hr per user" },
    { channel: "API", enabled: true, description: "Direct API access for internal tools and testing", rateLimit: "100 msg/hr per key" },
  ];
}
