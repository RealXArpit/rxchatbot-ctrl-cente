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
import { useLiveSessions } from "@/hooks/useLiveSessions";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Timestamp } from "@/components/platform/Timestamp";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

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
  const { data: liveSessions, isLoading: sessionsLoading } = useLiveSessions();

  useEffect(() => {
    if (sessionIdParam) {
      setFilters((prev) => ({ ...prev, q: sessionIdParam }));
      setPage(1);
    }
  }, [sessionIdParam]);

  const hasLiveData = liveData && liveData.length > 0;

  const result = useMemo(() => {
    if (hasLiveData) {
      const mapped = liveData.map(mapLiveRow);
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

        <Tabs defaultValue="past">
          <TabsList>
            <TabsTrigger value="past">Past Chats</TabsTrigger>
            <TabsTrigger value="live">Live Chats</TabsTrigger>
          </TabsList>

          <TabsContent value="past" className="space-y-4 mt-4">
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
          </TabsContent>

          <TabsContent value="live" className="mt-4">
            {sessionsLoading && <LoadingSkeleton />}
            {!sessionsLoading && (!liveSessions || liveSessions.length === 0) && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <p className="text-sm">No active sessions</p>
              </div>
            )}
            {!sessionsLoading && liveSessions && liveSessions.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Last Message</TableHead>
                      <TableHead className="text-right">Turn Count</TableHead>
                      <TableHead className="text-right">Avg Confidence</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Is Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveSessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.session_id.slice(0, 20)}{s.session_id.length > 20 ? "…" : ""}</TableCell>
                        <TableCell>{s.channel}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{s.last_message}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.turn_count}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.avg_confidence.toFixed(2)}</TableCell>
                        <TableCell><Timestamp date={s.last_message_at} /></TableCell>
                        <TableCell>
                          <Badge variant={s.is_active ? "default" : "secondary"} className={s.is_active ? "bg-success text-success-foreground" : ""}>
                            {s.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </RequireRole>
  );
}
