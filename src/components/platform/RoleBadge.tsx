import { cn } from "@/lib/utils";
import type { Role } from "@/lib/mock-api";

const roleColors: Record<Role, string> = {
  SuperAdmin: "bg-primary/15 text-primary",
  OpsManager: "bg-secondary/15 text-secondary",
  KnowledgeManager: "bg-warning/15 text-warning",
  SupportAgent: "bg-success/15 text-success",
  Auditor: "bg-muted text-muted-foreground",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", roleColors[role])}>
      {role}
    </span>
  );
}
