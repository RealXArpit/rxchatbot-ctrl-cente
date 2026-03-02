import { routeMetadata, type Role } from "@/lib/mock-api";
import { Check, X } from "lucide-react";

const allRoles: Role[] = ["SuperAdmin", "OpsManager", "KnowledgeManager", "SupportAgent", "Auditor"];

const moduleLabels: Record<string, string> = {
  overview: "Overview",
  train: "Train / Knowledge",
  monitoring: "Monitoring",
  "chat-logs": "Chat Logs",
  escalations: "Manual Escalations",
  feedback: "Feedback",
  configuration: "Configuration",
  integrations: "Integrations",
  users: "Users & Roles",
  audit: "Audit",
};

export function PermissionMatrixPanel() {
  const modules = Object.entries(routeMetadata);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Module</th>
            {allRoles.map((r) => (
              <th key={r} className="px-3 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">{r}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map(([slug, meta]) => (
            <tr key={slug} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5 font-medium text-foreground">{moduleLabels[slug] ?? slug}</td>
              {allRoles.map((role) => (
                <td key={role} className="px-3 py-2.5 text-center">
                  {meta.allowedRoles.includes(role) ? (
                    <Check className="h-4 w-4 text-success mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-destructive/40 mx-auto" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
