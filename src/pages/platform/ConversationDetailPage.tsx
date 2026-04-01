import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { RequireRole } from "@/components/platform/RequireRole";
import { routeMetadata } from "@/lib/mock-api";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { getConversationDetail } from "@/lib/mock-conversations";
import { ConversationDetailHeader } from "@/components/chat-logs/ConversationDetailHeader";
import { TranscriptThread } from "@/components/chat-logs/TranscriptThread";
import { PiiToggle } from "@/components/chat-logs/PiiToggle";
import { Separator } from "@/components/ui/separator";
import { useSessionTranscript } from "@/hooks/useSessionTranscript";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";
import { useChatLogs } from "@/hooks/useChatLogs";
import type { SelectedMessage } from "@/components/escalations/TranscriptWithSelection";
import { TranscriptWithSelection } from "@/components/escalations/TranscriptWithSelection";
import { CreateKbFromChatLogButton } from "@/components/chat-logs/CreateKbFromChatLogButton";

export default function ConversationDetailPage() {
  const { conversationId, env } = useParams<{ conversationId: string; env: string }>();
  const { env: tenantEnv } = useTenant();
  const { session } = useAuth();
  const isAuditor = session?.user.role === "Auditor";
  const [showRaw, setShowRaw] = useState(!isAuditor);
  const [selectedMessages, setSelectedMessages] = useState<SelectedMessage[]>([]);

  const detail = getConversationDetail(tenantEnv, conversationId ?? "");

  // Try to find the real sessionId from live chat_logs data
  const { data: chatLogsData } = useChatLogs();
  const liveLogRow = chatLogsData?.find((r: any) => r.id === conversationId);
  const resolvedSessionId =
    liveLogRow?.session_id ??
    detail?.conversation?.sessionId ??
    null;

  const {
    data: liveMessages,
    isLoading: transcriptLoading,
    error: transcriptError,
  } = useSessionTranscript(resolvedSessionId);

  // Build the conversation header from live data if mock detail not found
  const conversationForHeader = detail?.conversation ?? (liveLogRow ? {
    id: liveLogRow.id ?? conversationId ?? '',
    tenantId: 'realx',
    env: tenantEnv,
    channel: liveLogRow.channel ?? 'WEBSITE',
    sessionId: liveLogRow.session_id ?? '',
    userIdHash: liveLogRow.user_id ?? '',
    startedAt: liveLogRow.timestamp ?? '',
    endedAt: null,
    routedTo: liveLogRow.routed_to ?? 'BOT',
    confidence: liveLogRow.confidence ?? 0,
    cacheHit: liveLogRow.cache_hit ?? false,
    citations: Array.isArray(liveLogRow.citations) ? liveLogRow.citations : [],
    escalationReason: liveLogRow.escalation_reason ?? null,
    legalHold: false,
    logId: liveLogRow.id ?? '',
    tokensUsed: liveLogRow.tokens_used ?? 0,
    correlationId: liveLogRow.id ?? '',
    escalationPriority: null,
    sentiment: liveLogRow.sentiment ?? 'neutral',
    intent: liveLogRow.intent ?? 'FAQ',
    feedback: liveLogRow.feedback ?? null,
    adminReferenceAnswer: null,
  } : null);

  if (!conversationForHeader) {
    return <Navigate to={`/realx/${env}/chat-logs`} replace />;
  }

  return (
    <RequireRole allowedRoles={routeMetadata["chat-logs"].allowedRoles}>
      <div className="space-y-4 max-w-4xl">
        <ConversationDetailHeader
          conversation={conversationForHeader!}
          cacheEntry={detail?.cacheEntry ?? null}
        />

        <Separator />

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Transcript</h2>
          <div className="flex items-center gap-2">
            {selectedMessages.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {selectedMessages.length} selected
              </span>
            )}
            <CreateKbFromChatLogButton
              sessionId={resolvedSessionId ?? ""}
              selectedMessages={selectedMessages}
              onSuccess={() => setSelectedMessages([])}
            />
            <PiiToggle showRaw={showRaw} onChange={setShowRaw} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          {transcriptLoading && <LoadingSkeleton />}
          {!transcriptLoading && transcriptError && (
            <p className="text-sm text-muted-foreground">
              Could not load transcript from database.
            </p>
          )}
{!transcriptLoading && !transcriptError && (() => {
            // Do not render TranscriptWithSelection until we have a valid
            // session ID — passing empty string or fallback values causes
            // a Supabase Realtime subscription error
            if (!resolvedSessionId || resolvedSessionId.length < 10) {
              return (
                <p className="text-sm text-muted-foreground">
                  No transcript recorded for this session yet.
                </p>
              );
            }
            return (
              <TranscriptWithSelection
                sessionId={resolvedSessionId}
                selectedMessages={selectedMessages}
                onSelectionChange={setSelectedMessages}
              />
            );
          })()}
        </div>
      </div>
    </RequireRole>
  );
}
