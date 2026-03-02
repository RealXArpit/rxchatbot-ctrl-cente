import { Building2 } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

export function OrgTeamSwitcher() {
  const { context } = useTenant();
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Building2 className="h-4 w-4" />
      <span className="font-medium text-foreground">{context?.org.name ?? "RealX"}</span>
      <span className="text-muted-foreground">·</span>
      <span>{context?.teams[0]?.name ?? "Ops"}</span>
    </div>
  );
}
