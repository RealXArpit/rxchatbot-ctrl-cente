import type { EnvConfig } from '@/types/webhook';

export const ENV_CONFIGS: Record<'dev' | 'prod', EnvConfig> = {
  dev: {
    env: 'dev',
    webhookBaseUrl: import.meta.env.VITE_DEV_WEBHOOK_BASE_URL
      ?? 'https://n8n-production-5c06.up.railway.app/webhook',
    apiKey:   import.meta.env.VITE_DEV_API_KEY ?? 'rx-chat-sk-2026-M9aG',
    agentKey: import.meta.env.VITE_DEV_AGENT_KEY ?? 'rx-chat-sk-2026-M9aG',
    adminKey: import.meta.env.VITE_DEV_ADMIN_KEY ?? 'rx-chat-sk-2026-M9aG',
    label: 'Dev',
  },
  prod: {
    env: 'prod',
    webhookBaseUrl: import.meta.env.VITE_PROD_WEBHOOK_BASE_URL
      ?? 'https://n8n-production-8279e.up.railway.app/webhook',
    apiKey:   import.meta.env.VITE_PROD_API_KEY ?? 'rx-chat-sk-2026-PROD-CgatBhtr',
    agentKey: import.meta.env.VITE_PROD_AGENT_KEY ?? 'rx-chat-sk-2026-PROD-CgatBhtr',
    adminKey: import.meta.env.VITE_PROD_ADMIN_KEY ?? 'rx-chat-sk-2026-PROD-CgatBhtr',
    label: 'Production',
  },
};

export function getEnvConfig(env: 'dev' | 'prod'): EnvConfig {
  return ENV_CONFIGS[env];
}
