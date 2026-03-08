import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WebhookEndpointInfo } from "@/lib/mock-integrations";

const statusDot: Record<string, string> = {
  active: "bg-success",
  inactive: "bg-destructive",
  unknown: "bg-muted-foreground/40",
};

interface Props {
  endpoint: WebhookEndpointInfo;
  onStatusChange: (status: "active" | "inactive") => void;
}

export function WebhookEndpointCard({ endpoint, onStatusChange }: Props) {
  const { envConfig } = useTenant();
  const [testing, setTesting] = useState(false);
  const fullUrl = `${envConfig?.webhookBaseUrl ?? ""}${endpoint.path}`;

  const handleTest = async () => {
    setTesting(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(fullUrl, { method: "HEAD", signal: controller.signal });
      clearTimeout(timeout);
      onStatusChange(res.ok ? "active" : "inactive");
    } catch {
      onStatusChange("inactive");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full shrink-0", statusDot[endpoint.status])} />
          <span className="text-sm font-medium">{endpoint.name}</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">{endpoint.method}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{endpoint.description}</p>
      <div className="flex items-center gap-2">
        <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded truncate flex-1">
          {fullUrl}
        </code>
      </div>
      {endpoint.lastCalledAt && (
        <p className="text-[10px] text-muted-foreground tabular-nums">Last called: {new Date(endpoint.lastCalledAt).toLocaleString()}</p>
      )}
      <Button size="sm" variant="outline" className="text-xs w-full" onClick={handleTest} disabled={testing}>
        {testing && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
        Test Connection
      </Button>
    </div>
  );
}
