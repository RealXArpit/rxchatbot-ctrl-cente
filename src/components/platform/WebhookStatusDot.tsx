import { useEffect, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Status = "unknown" | "reachable" | "error";

const statusColors: Record<Status, string> = {
  unknown: "bg-muted-foreground/40",
  reachable: "bg-success",
  error: "bg-warning",
};

const statusLabels: Record<Status, string> = {
  unknown: "Checking…",
  reachable: "Online",
  error: "Offline",
};

export function WebhookStatusDot() {
  const { envConfig } = useTenant();
  const { session } = useAuth();
  const [status, setStatus] = useState<Status>("unknown");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const canSeeUrl = session?.user.role === "SuperAdmin" || session?.user.role === "OpsManager";

  useEffect(() => {
    if (!envConfig) return;

    const check = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${envConfig.webhookBaseUrl}/realx-ai`, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        setStatus(res.ok ? "reachable" : "error");
      } catch {
        setStatus("error");
      }
      setLastChecked(new Date());
    };

    check();
    intervalRef.current = setInterval(check, 60_000);
    return () => clearInterval(intervalRef.current);
  }, [envConfig?.webhookBaseUrl]);

  if (!envConfig) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full shrink-0 transition-colors",
            statusColors[status],
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs space-y-1 max-w-xs">
        <p className="font-medium">{envConfig.label}</p>
        <p className="text-muted-foreground">
          {canSeeUrl ? envConfig.webhookBaseUrl : "Webhook configured"}
        </p>
        {lastChecked && (
          <p className="text-muted-foreground">
            Checked: {format(lastChecked, "HH:mm:ss")}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
