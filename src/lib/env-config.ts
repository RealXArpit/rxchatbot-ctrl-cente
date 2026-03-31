import type { EnvConfig } from '@/types/webhook';

export const ENV_CONFIGS: Record<'dev' | 'prod', EnvConfig> = {
  dev: {
    env: 'dev',
    webhookBaseUrl: import.meta.env.VITE_N8N_WEBHOOK_URL_DEV
      ?? 'https://n8n-production-5c06.up.railway.app/webhook',
    apiKey:   import.meta.env.VITE_API_KEY_DEV ?? 'rx-chat-sk-2026-M9aG',
    agentKey: import.meta.env.VITE_API_KEY_DEV ?? 'rx-chat-sk-2026-M9aG',
    adminKey: import.meta.env.VITE_API_KEY_DEV ?? 'rx-chat-sk-2026-M9aG',
    label: 'Dev',
  },
  prod: {
    env: 'prod',
    webhookBaseUrl: import.meta.env.VITE_N8N_WEBHOOK_URL_PROD
      ?? 'https://n8n-production-5c06.up.railway.app/webhook',
    apiKey:   import.meta.env.VITE_API_KEY_PROD ?? 'rx-chat-sk-2026-M9aG',
    agentKey: import.meta.env.VITE_API_KEY_PROD ?? 'rx-chat-sk-2026-M9aG',
    adminKey: import.meta.env.VITE_API_KEY_PROD ?? 'rx-chat-sk-2026-M9aG',
    label: 'Production',
  },
};

export function getEnvConfig(env: 'dev' | 'prod'): EnvConfig {
  return ENV_CONFIGS[env];
}
