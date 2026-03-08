import { StatusPill } from "@/components/platform/StatusPill";
import type { ChannelConfig } from "@/lib/mock-integrations";

interface Props {
  config: ChannelConfig;
}

export function ChannelConfigCard({ config }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{config.channel}</span>
        <StatusPill label={config.enabled ? "Enabled" : "Disabled"} variant={config.enabled ? "success" : "muted"} />
      </div>
      <p className="text-xs text-muted-foreground">{config.description}</p>
      <p className="text-[11px] text-muted-foreground">Rate limit: <span className="font-medium text-foreground">{config.rateLimit}</span></p>
    </div>
  );
}
