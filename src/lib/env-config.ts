import type { EnvConfig } from "@/types/webhook";

export const ENV_CONFIGS: Record<"dev" | "prod", EnvConfig> = {
  dev: {
    env: "dev",
    webhookBaseUrl: "https://n8n-production-5c06.up.railway.app/webhook",
    apiKey: "rx-chat-sk-2026-M9aG",
    agentKey: "rx-chat-sk-2026-M9aG",
    adminKey: "rx-chat-sk-2026-M9aG",
    label: "Dev",
  },
  prod: {
    env: "prod",
    webhookBaseUrl: "https://n8n-production-5c06.up.railway.app/webhook",
    apiKey: "rx-chat-sk-2026-M9aG",
    agentKey: "rx-chat-sk-2026-M9aG",
    adminKey: "rx-chat-sk-2026-M9aG",
    label: "Production",
  },
};

export function getEnvConfig(env: "dev" | "prod"): EnvConfig {
  return ENV_CONFIGS[env];
}
