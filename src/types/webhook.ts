export interface EnvConfig {
  env: "dev" | "prod";
  webhookBaseUrl: string;
  apiKey: string;
  agentKey: string;
  adminKey: string;
  label: string;
}

export interface WebhookEndpoints {
  chat: string;
  feedback: string;
  agentPost: string;
  agentPoll: string;
  admin: string;
}

export function getEndpoints(cfg: EnvConfig): WebhookEndpoints {
  const b = cfg.webhookBaseUrl;
  return {
    chat: `${b}/realx-ai`,
    feedback: `${b}/realx-ai-feedback`,
    agentPost: `${b}/realx-ai-agent`,
    agentPoll: `${b}/realx-ai-agent-poll`,
    admin: `${b}/realx-ai-admin`,
  };
}
