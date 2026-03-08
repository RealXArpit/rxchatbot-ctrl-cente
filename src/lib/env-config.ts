import type { EnvConfig } from "@/types/webhook";

export const ENV_CONFIGS: Record<"dev" | "prod", EnvConfig> = {
  dev: {
    env: "dev",
    webhookBaseUrl: import.meta.env.VITE_DEV_WEBHOOK_BASE_URL ?? "http://localhost:5678/webhook",
    apiKey: import.meta.env.VITE_DEV_API_KEY ?? "dev-placeholder-key",
    agentKey: import.meta.env.VITE_DEV_AGENT_KEY ?? "dev-agent-placeholder",
    adminKey: import.meta.env.VITE_DEV_ADMIN_KEY ?? "dev-admin-placeholder",
    label: "Local Dev",
  },
  prod: {
    env: "prod",
    webhookBaseUrl: import.meta.env.VITE_PROD_WEBHOOK_BASE_URL ?? "https://your-n8n-instance.com/webhook",
    apiKey: import.meta.env.VITE_PROD_API_KEY ?? "prod-placeholder-key",
    agentKey: import.meta.env.VITE_PROD_AGENT_KEY ?? "prod-agent-placeholder",
    adminKey: import.meta.env.VITE_PROD_ADMIN_KEY ?? "prod-admin-placeholder",
    label: "Production",
  },
};

export function getEnvConfig(env: "dev" | "prod"): EnvConfig {
  return ENV_CONFIGS[env];
}
