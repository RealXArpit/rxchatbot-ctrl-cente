import { ConfigSectionCard } from "./ConfigSectionCard";
import type { EscalationPolicyConfig } from "@/lib/mock-config";

interface EscalationPolicyEditorProps {
  config: EscalationPolicyConfig;
  readOnly: boolean;
}

export function EscalationPolicyEditor({ config, readOnly }: EscalationPolicyEditorProps) {
  return (
    <ConfigSectionCard title="Escalation Policy" description="Business hours and SLA defaults." readOnly={readOnly}>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Hours</p>
          <p className="text-sm text-foreground mt-0.5">{config.businessHours}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">SLA Targets (First Response / Resolution)</p>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(config.sla).map(([priority, value]) => (
              <div key={priority} className="rounded-md border border-border bg-muted/50 px-3 py-2">
                <span className="text-xs font-semibold text-foreground">{priority}</span>
                <p className="text-sm font-mono text-muted-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ConfigSectionCard>
  );
}
