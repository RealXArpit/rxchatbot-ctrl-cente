import { useState, useMemo } from "react";
import { PageHeader } from "@/components/platform/PageHeader";
import { RequireRole } from "@/components/platform/RequireRole";
import { routeMetadata } from "@/lib/mock-api";
import { useTenant } from "@/contexts/TenantContext";
import { getConversations, type ConversationFilters, type ColumnKey } from "@/lib/mock-conversations";
import { LogsFiltersBar } from "@/components/chat-logs/LogsFiltersBar";
import { LogsTable } from "@/components/chat-logs/LogsTable";
import { ColumnPicker, loadColumns } from "@/components/chat-logs/ColumnPicker";
import { SavedViews } from "@/components/chat-logs/SavedViews";
import { ExportButton } from "@/components/chat-logs/ExportButton";
import { LiveDataBanner } from "@/components/chat-logs/LiveDataBanner";

export default function ChatLogsPage() {
  const { env } = useTenant();
  const [filters, setFilters] = useState<ConversationFilters>({});
  const [page, setPage] = useState(1);
  const [columns, setColumns] = useState<ColumnKey[]>(loadColumns);
  const pageSize = 25;

  const result = useMemo(
    () => getConversations(env, filters, page, pageSize),
    [env, filters, page]
  );

  const handleFilterChange = (f: ConversationFilters) => {
    setFilters(f);
    setPage(1);
  };

  return (
    <RequireRole allowedRoles={routeMetadata["chat-logs"].allowedRoles}>
      <div className="space-y-4">
        <PageHeader
          title="Chat Logs"
          subtitle="Browse and search conversation transcripts."
          actions={
            <div className="flex items-center gap-2">
              <SavedViews />
              <ColumnPicker value={columns} onChange={setColumns} />
              <ExportButton />
            </div>
          }
        />

        <LiveDataBanner />
        <LogsFiltersBar filters={filters} onChange={handleFilterChange} />

        <LogsTable
          items={result.items}
          columns={columns}
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          onPageChange={setPage}
        />
      </div>
    </RequireRole>
  );
}
