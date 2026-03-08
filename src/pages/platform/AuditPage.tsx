import { PageHeader } from "@/components/platform/PageHeader";
import { RequireRole } from "@/components/platform/RequireRole";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { getAuditLog } from "@/lib/mock-audit";

export default function AuditPage() {
  const events = getAuditLog();

  return (
    <RequireRole allowedRoles={["SuperAdmin", "OpsManager", "Auditor"]}>
      <div>
        <PageHeader
          title="Audit Log"
          subtitle="Activity log of all admin actions taken within the console."
        />
        <AuditLogTable events={events} />
      </div>
    </RequireRole>
  );
}
