import { getEnvConfig } from "@/lib/env-config";
import { getEndpoints } from "@/types/webhook";
import type { EnvConfig, WebhookEndpoints } from "@/types/webhook";
import type {
  ChatRequest, ChatResponse,
  FeedbackRequest, FeedbackResponse,
  AgentInterventionRequest, AgentInterventionResponse,
  AgentMessage,
  AdminRequest, AdminResponse,
} from "@/types/n8n-responses";

export class N8nClient {
  private cfg: EnvConfig;
  private endpoints: WebhookEndpoints;

  constructor(env: "dev" | "prod") {
    this.cfg = getEnvConfig(env);
    this.endpoints = getEndpoints(this.cfg);
  }

  private async post<T>(url: string, body: unknown, key: string): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-chatbot-api-key": key,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`n8n error ${res.status}: ${await res.text()}`);
    return res.json() as Promise<T>;
  }

  async sendMessage(req: ChatRequest): Promise<ChatResponse> {
    return this.post<ChatResponse>(this.endpoints.chat, req, this.cfg.apiKey);
  }

  async sendFeedback(req: FeedbackRequest): Promise<FeedbackResponse> {
    return this.post<FeedbackResponse>(this.endpoints.feedback, req, this.cfg.apiKey);
  }

  async agentIntervene(req: AgentInterventionRequest): Promise<AgentInterventionResponse> {
    return this.post<AgentInterventionResponse>(this.endpoints.agentPost, req, this.cfg.agentKey);
  }

  async pollAgentMessages(sessionId: string): Promise<AgentMessage[]> {
    const url = `${this.endpoints.agentPoll}?sessionId=${encodeURIComponent(sessionId)}`;
    const res = await fetch(url, {
      headers: { "x-chatbot-api-key": this.cfg.agentKey },
    });
    if (!res.ok) return [];
    return res.json() as Promise<AgentMessage[]>;
  }

  async adminAction(req: AdminRequest): Promise<AdminResponse> {
    return this.post<AdminResponse>(this.endpoints.admin, req, this.cfg.adminKey);
  }
}

// Singleton per env — recreated when env switches
const clients: Partial<Record<"dev" | "prod", N8nClient>> = {};
export function getN8nClient(env: "dev" | "prod"): N8nClient {
  if (!clients[env]) clients[env] = new N8nClient(env);
  return clients[env]!;
}
