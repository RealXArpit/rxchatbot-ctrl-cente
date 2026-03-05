import { useState, useCallback } from "react";
import { PageHeader } from "@/components/platform/PageHeader";
import { RequireRole } from "@/components/platform/RequireRole";
import { routeMetadata } from "@/lib/mock-api";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonitoringKpiPanel } from "@/components/monitoring/MonitoringKpiPanel";
import { MetricsExplorer } from "@/components/monitoring/MetricsExplorer";
import { AlertRulesTable } from "@/components/monitoring/AlertRulesTable";
import { AlertRuleEditor } from "@/components/monitoring/AlertRuleEditor";
import { AlertEventsTable } from "@/components/monitoring/AlertEventsTable";
import { IncidentBanner } from "@/components/monitoring/IncidentBanner";
import {
  getAlertRules,
  getAlertRule,
  getAlertEvents,
  getDangerEventCount,
  createAlertRule,
  updateAlertRule,
} from "@/lib/mock-monitoring";
import { ExportButton } from "@/components/chat-logs/ExportButton";
import type { Role } from "@/lib/mock-api";

const EDIT_ROLES: Role[] = ["SuperAdmin", "OpsManager"];

export default function MonitoringPage() {
  const { env } = useTenant();
  const { session } = useAuth();
  const role = session?.user.role;
  const canEdit = EDIT_ROLES.includes(role as Role);

  const [rules, setRules] = useState(() => getAlertRules(env));
  const [events] = useState(() => getAlertEvents(env));
  const dangerCount = getDangerEventCount(env);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const handleToggle = useCallback((ruleId: string, enabled: boolean) => {
    updateAlertRule(env, ruleId, { enabled });
    setRules(getAlertRules(env));
  }, [env]);

  const handleEdit = useCallback((ruleId: string) => {
    setEditingRuleId(ruleId);
    setEditorOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingRuleId(null);
    setEditorOpen(true);
  }, []);

  const handleSave = useCallback((data: any) => {
    if (editingRuleId) {
      updateAlertRule(env, editingRuleId, data);
    } else {
      createAlertRule(env, data);
    }
    setRules(getAlertRules(env));
  }, [env, editingRuleId]);

  const editingRule = editingRuleId ? getAlertRule(env, editingRuleId) : null;

  return (
    <RequireRole allowedRoles={routeMetadata.monitoring.allowedRoles}>
      <PageHeader
        title="Monitoring"
        subtitle="Real-time bot performance, system metrics, and alert management."
        actions={
          canEdit ? <ExportButton /> : undefined
        }
      />

      <IncidentBanner count={dangerCount} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">
            Alert Rules
            {rules.filter((r) => r.enabled).length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({rules.filter((r) => r.enabled).length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="events">
            Events
            {dangerCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                {dangerCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MonitoringKpiPanel />
          <MetricsExplorer />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertRulesTable
            rules={rules}
            canEdit={canEdit}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onCreate={handleCreate}
          />
          <AlertRuleEditor
            open={editorOpen}
            onClose={() => setEditorOpen(false)}
            rule={editingRule}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="events">
          <AlertEventsTable events={events} />
        </TabsContent>
      </Tabs>
    </RequireRole>
  );
}
