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

export default function ConversationDetailPage() {
  const { conversationId, env } = useParams<{ conversationId: string; env: string }>();
  const { env: tenantEnv } = useTenant();
  const { session } = useAuth();
  const isAuditor = session?.user.role === "Auditor";
  const [showRaw, setShowRaw] = useState(!isAuditor);

  const detail = getConversationDetail(tenantEnv, conversationId ?? "");

  if (!detail) {
    return <Navigate to={`/realx/${env}/chat-logs`} replace />;
  }

  return (
    <RequireRole allowedRoles={routeMetadata["chat-logs"].allowedRoles}>
      <div className="space-y-4 max-w-4xl">
        <ConversationDetailHeader
          conversation={detail.conversation}
          cacheEntry={detail.cacheEntry}
        />

        <Separator />

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Transcript</h2>
          <PiiToggle showRaw={showRaw} onChange={setShowRaw} />
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <TranscriptThread messages={detail.messages} showRaw={showRaw} />
        </div>
      </div>
    </RequireRole>
  );
}
