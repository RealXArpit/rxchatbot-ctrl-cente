import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Download,
  FileText,
  SlidersHorizontal,
  Lock,
} from "lucide-react";
import type { Role } from "@/lib/mock-api";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  route?: string;
  locked?: boolean;
  roles: Role[];
}

const quickActions: QuickAction[] = [
  { label: "Review Alerts", icon: AlertCircle, route: "monitoring", roles: ["SuperAdmin", "OpsManager"] },
  { label: "Change Routing Thresholds", icon: SlidersHorizontal, locked: true, roles: ["SuperAdmin", "OpsManager"] },
  { label: "Export Logs", icon: Download, locked: true, roles: ["SuperAdmin", "OpsManager"] },
  { label: "Add KB Item", icon: BookOpen, route: "train", roles: ["KnowledgeManager"] },
  { label: "Go to Escalations", icon: ArrowRight, route: "escalations", roles: ["SupportAgent"] },
  { label: "Open Audit", icon: FileText, route: "audit", roles: ["Auditor"] },
];

export function QuickActionsBar() {
  const { session } = useAuth();
  const { env } = useTenant();
  const navigate = useNavigate();
  const role = session?.user.role;

  const visible = quickActions.filter((a) => role && a.roles.includes(role));
  if (visible.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Quick Actions</h3>
      <div className="flex flex-wrap gap-2">
        {visible.map((a) => (
          <Button
            key={a.label}
            variant="outline"
            size="sm"
            disabled={a.locked}
            onClick={() => a.route && navigate(`/realx/${env}/${a.route}`)}
            className="text-xs"
          >
            {a.locked ? <Lock className="h-3 w-3 mr-1.5" /> : <a.icon className="h-3 w-3 mr-1.5" />}
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
