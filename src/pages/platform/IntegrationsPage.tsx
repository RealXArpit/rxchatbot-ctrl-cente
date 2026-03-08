import { useState, useMemo } from "react";
import { PageHeader } from "@/components/platform/PageHeader";
import { RequireRole } from "@/components/platform/RequireRole";
import { ConfigSectionCard } from "@/components/configuration/ConfigSectionCard";
import { WebhookEndpointCard } from "@/components/integrations/WebhookEndpointCard";
import { CredentialSlotTable } from "@/components/integrations/CredentialSlotTable";
import { ChannelConfigCard } from "@/components/integrations/ChannelConfigCard";
import { useTenant } from "@/contexts/TenantContext";
import {
  getWebhookEndpoints,
  getCredentialSlots,
  getChannelConfigs,
  type WebhookEndpointInfo,
} from "@/lib/mock-integrations";

export default function IntegrationsPage() {
  const { env } = useTenant();
  const [endpoints, setEndpoints] = useState<WebhookEndpointInfo[]>(() => getWebhookEndpoints());
  const slots = useMemo(() => getCredentialSlots(env), [env]);
  const channels = useMemo(() => getChannelConfigs(), []);

  const updateStatus = (idx: number, status: "active" | "inactive") => {
    setEndpoints((prev) =>
      prev.map((e, i) => i === idx ? { ...e, status, lastCalledAt: new Date().toISOString() } : e)
    );
  };

  return (
    <RequireRole allowedRoles={["SuperAdmin", "OpsManager"]}>
      <div className="space-y-6">
        <PageHeader title="Integrations" subtitle="Webhook endpoints, credential references, and channel configuration." />

        <ConfigSectionCard title="Webhook Endpoints" description="n8n workflow endpoints connected to this environment.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {endpoints.map((ep, i) => (
              <WebhookEndpointCard key={ep.path} endpoint={ep} onStatusChange={(s) => updateStatus(i, s)} />
            ))}
          </div>
        </ConfigSectionCard>

        <ConfigSectionCard title="Credential References" description="Environment variable slots — values never displayed. Configure in .env file.">
          <CredentialSlotTable slots={slots} />
        </ConfigSectionCard>

        <ConfigSectionCard title="Channel Configuration" description="Supported messaging channels and rate limits.">
          <div className="grid sm:grid-cols-3 gap-3">
            {channels.map((ch) => (
              <ChannelConfigCard key={ch.channel} config={ch} />
            ))}
          </div>
        </ConfigSectionCard>
      </div>
    </RequireRole>
  );
}
