import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/platform/PageHeader";
import { RequireRole } from "@/components/platform/RequireRole";
import { routeMetadata } from "@/lib/mock-api";
import { useTenant } from "@/contexts/TenantContext";
import { getConversations, type Conversation, type ConversationFilters, type ColumnKey } from "@/lib/mock-conversations";
import { LogsFiltersBar } from "@/components/chat-logs/LogsFiltersBar";
import { LogsTable } from "@/components/chat-logs/LogsTable";
import { ColumnPicker, loadColumns } from "@/components/chat-logs/ColumnPicker";
import { SavedViews } from "@/components/chat-logs/SavedViews";
import { ExportButton } from "@/components/chat-logs/ExportButton";
import { LiveDataBanner } from "@/components/chat-logs/LiveDataBanner";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";
import { ErrorPanel } from "@/components/platform/ErrorPanel";
import { useChatLogs } from "@/hooks/useChatLogs";

function mapLiveRow(row: any): Conversation {
  return {
    id: row.id ?? "",
    tenantId: "realx",
    env: "dev",
    channel: row.channel ?? "WEBSITE",
    sessionId: row.session_id ?? row.id ?? "",
    userIdHash: row.user_id ?? "",
    startedAt: row.timestamp ?? new Date().toISOString(),
    endedAt: null,
    routedTo: row.routed_to ?? "BOT",
    confidence: row.confidence ?? 0,
    cacheHit: row.cache_hit ?? false,
    citations: row.citations ?? [],
    escalationReason: null,
    legalHold: false,
    logId: row.id ?? "",
    tokensUsed: row.tokens_used ?? 0,
    correlationId: row.id ?? "",
    escalationPriority: null,
    sentiment: row.sentiment ?? "neutral",
    intent: row.intent ?? "FAQ",
    feedback: row.feedback ?? null,
    adminReferenceAnswer: null,
  };
}

export default function ChatLogsPage() {
  const { env } = useTenant();
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");

  const [filters, setFilters] = useState<ConversationFilters>(() =>
    sessionIdParam ? { q: sessionIdParam } : {}
  );
  const [page, setPage] = useState(1);
  const [columns, setColumns] = useState<ColumnKey[]>(loadColumns);
  const pageSize = 25;

  const { data: liveData, isLoading, error, refetch } = useChatLogs();

  // Apply sessionId param on mount / change
  useEffect(() => {
    if (sessionIdParam) {
      setFilters((prev) => ({ ...prev, q: sessionIdParam }));
      setPage(1);
    }
  }, [sessionIdParam]);

  // Map live data or fall back to mock data
  const hasLiveData = liveData && liveData.length > 0;

  const result = useMemo(() => {
    if (hasLiveData) {
      const mapped = liveData.map(mapLiveRow);
      // Apply simple client-side filtering for sessionId
      const filtered = filters.q
        ? mapped.filter(
            (c) =>
              c.id.includes(filters.q!) ||
              c.sessionId.includes(filters.q!) ||
              c.channel.toLowerCase().includes(filters.q!.toLowerCase())
          )
        : mapped;
      const start = (page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);
      return { items: paged, page, pageSize, total: filtered.length };
    }
    return getConversations(env, filters, page, pageSize);
  }, [env, filters, page, hasLiveData, liveData]);

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

        {!hasLiveData && <LiveDataBanner />}
        {isLoading && <LoadingSkeleton />}
        {error && !isLoading && <ErrorPanel onRetry={() => refetch()} />}

        {!isLoading && (
          <>
            <LogsFiltersBar filters={filters} onChange={handleFilterChange} />
            <LogsTable
              items={result.items}
              columns={columns}
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </RequireRole>
  );
}
