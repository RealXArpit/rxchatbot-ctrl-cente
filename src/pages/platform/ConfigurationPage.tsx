import { useState, useCallback } from "react";
import { PageHeader } from "@/components/platform/PageHeader";
import { RequireRole } from "@/components/platform/RequireRole";
import { routeMetadata } from "@/lib/mock-api";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoutingThresholdEditor } from "@/components/configuration/RoutingThresholdEditor";
import { RetentionEditor } from "@/components/configuration/RetentionEditor";
import { EscalationPolicyEditor } from "@/components/configuration/EscalationPolicyEditor";
import { ConfigApprovalFlow } from "@/components/configuration/ConfigApprovalFlow";
import { WorkflowVersionTable } from "@/components/configuration/WorkflowVersionTable";
import { DiffViewer } from "@/components/configuration/DiffViewer";
import { RollbackModal } from "@/components/configuration/RollbackModal";
import { StatusPill } from "@/components/platform/StatusPill";
import { Timestamp } from "@/components/platform/Timestamp";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  getCurrentConfig,
  getWorkflowVersions,
  getWorkflowVersion,
  proposeVersion,
  approveVersion,
  publishVersion,
  rollbackVersion,
  type FullConfig,
} from "@/lib/mock-config";
import type { Role } from "@/lib/mock-api";

export default function ConfigurationPage() {
  const { env } = useTenant();
  const { session } = useAuth();
  const role = session?.user.role as Role;

  const isSuperAdmin = role === "SuperAdmin";
  const isOpsOrSuper = role === "OpsManager" || isSuperAdmin;
  const isAuditor = role === "Auditor";
  const readOnly = !isOpsOrSuper;
  const retentionReadOnly = !isSuperAdmin;

  const [config, setConfig] = useState(() => getCurrentConfig(env));
  const [stagedConfig, setStagedConfig] = useState<FullConfig | null>(null);
  const [versions, setVersions] = useState(() => getWorkflowVersions(env));

  // Detail view state
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<{ id: string; version: string } | null>(null);

  const pendingProposed = versions.find((v) => v.status === "Proposed");
  const pendingApproved = versions.find((v) => v.status === "Approved");

  const refresh = useCallback(() => {
    setVersions(getWorkflowVersions(env));
    setConfig(getCurrentConfig(env));
  }, [env]);

  const handleRouteChange = useCallback((routing: FullConfig["routing"]) => {
    setStagedConfig((prev) => ({ ...(prev ?? config), routing }));
  }, [config]);

  const handleRetentionChange = useCallback((retention: FullConfig["retention"]) => {
    setStagedConfig((prev) => ({ ...(prev ?? config), retention }));
  }, [config]);

  const handlePropose = useCallback((reason: string) => {
    if (!stagedConfig) return;
    proposeVersion(env, stagedConfig, reason, session?.user.name ?? "Unknown");
    setStagedConfig(null);
    refresh();
    toast({ title: "Version proposed", description: "Awaiting approval." });
  }, [env, stagedConfig, session, refresh]);

  const handleApprove = useCallback((versionId: string) => {
    approveVersion(versionId);
    refresh();
    toast({ title: "Version approved" });
  }, [refresh]);

  const handlePublish = useCallback((versionId: string) => {
    publishVersion(versionId);
    refresh();
    toast({ title: "Version published" });
  }, [refresh]);

  const handleRollback = useCallback((reason: string, ticketRef: string) => {
    if (!rollbackTarget) return;
    rollbackVersion(rollbackTarget.id, reason, ticketRef);
    refresh();
  }, [rollbackTarget, refresh]);

  // Version detail view
  const detailVersion = detailId ? getWorkflowVersion(env, detailId) : null;

  if (detailVersion) {
    const sv = detailVersion.status === "Published" ? "success" as const
      : detailVersion.status === "Approved" ? "primary" as const
      : detailVersion.status === "Proposed" ? "warning" as const
      : detailVersion.status === "Rolled Back" ? "danger" as const
      : "muted" as const;

    return (
      <RequireRole allowedRoles={routeMetadata.configuration.allowedRoles}>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setDetailId(null)} className="gap-1 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to versions
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Version {detailVersion.version}</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusPill label={detailVersion.status} variant={sv} />
                <Timestamp date={detailVersion.updatedAt} fmt="d MMM yyyy, HH:mm" />
                <span className="text-xs text-muted-foreground">by {detailVersion.actorName}</span>
              </div>
            </div>
            {isSuperAdmin && detailVersion.status === "Published" && (
              <Button variant="destructive" size="sm" className="gap-1" onClick={() => { setRollbackTarget({ id: detailVersion.id, version: detailVersion.version }); setRollbackOpen(true); }}>
                <RotateCcw className="h-3.5 w-3.5" /> Rollback
              </Button>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Reason:</span> {detailVersion.reason}</p>
            {detailVersion.ticketRef && (
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Ticket:</span> {detailVersion.ticketRef}</p>
            )}
          </div>

          <DiffViewer before={detailVersion.previousConfig} after={detailVersion.config} />

          <RollbackModal
            open={rollbackOpen}
            onClose={() => setRollbackOpen(false)}
            versionLabel={rollbackTarget?.version ?? ""}
            onRollback={handleRollback}
          />
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole allowedRoles={routeMetadata.configuration.allowedRoles}>
      <PageHeader
        title="Configuration"
        subtitle="Bot behavior, routing thresholds, retention, and workflow versioning."
        actions={
          <ConfigApprovalFlow
            canPropose={isOpsOrSuper}
            canApprove={isSuperAdmin}
            canPublish={isSuperAdmin}
            hasStagedChanges={!!stagedConfig}
            onPropose={handlePropose}
            pendingProposedId={pendingProposed?.id ?? null}
            pendingApprovedId={pendingApproved?.id ?? null}
            onApprove={handleApprove}
            onPublish={handlePublish}
          />
        }
      />

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="versions">
            Versions
            <span className="ml-1.5 text-xs text-muted-foreground">({versions.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <RoutingThresholdEditor
            config={stagedConfig?.routing ?? config.routing}
            readOnly={readOnly}
            onChange={handleRouteChange}
          />
          <RetentionEditor
            config={stagedConfig?.retention ?? config.retention}
            readOnly={retentionReadOnly}
            onChange={handleRetentionChange}
          />
          <EscalationPolicyEditor config={config.escalation} readOnly={readOnly || isAuditor} />
        </TabsContent>

        <TabsContent value="versions">
          <WorkflowVersionTable versions={versions} onViewDetail={setDetailId} />
        </TabsContent>
      </Tabs>
    </RequireRole>
  );
}
