import { StatusPill } from "@/components/platform/StatusPill";
import { Timestamp } from "@/components/platform/Timestamp";
import type { Conversation, CacheEntry } from "@/lib/mock-conversations";
import { useTenant } from "@/contexts/TenantContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";

function confidenceVariant(c: number): "success" | "warning" | "danger" {
  if (c >= 0.72) return "success";
  if (c >= 0.55) return "warning";
  return "danger";
}

function confidenceLabel(c: number) {
  if (c >= 0.72) return "High";
  if (c >= 0.55) return "Medium";
  return "Low";
}

interface ConversationDetailHeaderProps {
  conversation: Conversation;
  cacheEntry: CacheEntry | null;
}

export function ConversationDetailHeader({ conversation: conv, cacheEntry }: ConversationDetailHeaderProps) {
  const { env } = useTenant();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => navigate(`/realx/${env}/chat-logs`)}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <h1 className="text-lg font-semibold text-foreground font-mono">{conv.id}</h1>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 rounded-lg border border-border bg-card p-4">
        <div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Channel</span>
          <p className="text-sm font-medium mt-0.5">{conv.channel}</p>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Started</span>
          <p className="mt-0.5"><Timestamp date={conv.startedAt} fmt="d MMM yyyy, HH:mm" /></p>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Routed To</span>
          <p className="mt-0.5"><StatusPill label={conv.routedTo} variant={conv.routedTo === "BOT" ? "primary" : "warning"} /></p>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Confidence</span>
          <p className="mt-0.5 flex items-center gap-1.5">
            <span className="tabular-nums text-sm">{conv.confidence.toFixed(2)}</span>
            <StatusPill label={confidenceLabel(conv.confidence)} variant={confidenceVariant(conv.confidence)} />
          </p>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Cache</span>
          <p className="mt-0.5"><StatusPill label={conv.cacheHit ? "Hit" : "Miss"} variant={conv.cacheHit ? "success" : "muted"} /></p>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Legal Hold</span>
          <p className="mt-0.5">
            {conv.legalHold ? <StatusPill label="Active" variant="danger" /> : <span className="text-sm text-muted-foreground">None</span>}
          </p>
        </div>
      </div>

      {/* Citations & extra info */}
      <div className="flex flex-wrap items-center gap-3">
        {conv.citations.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Citations:</span>
            {conv.citations.map((c, i) => (
              <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">{c}</span>
            ))}
          </div>
        )}
        {conv.escalationReason && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Escalation:</span>
            <span className="text-xs text-muted-foreground">{conv.escalationReason}</span>
          </div>
        )}
        {cacheEntry && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Cache key:</span>
            <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px]">{cacheEntry.cacheKey}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[11px] gap-1 text-muted-foreground ml-auto"
          onClick={() => navigate(`/realx/${env}/audit`)}
        >
          <ExternalLink className="h-3 w-3" /> Audit Trail
        </Button>
      </div>
    </div>
  );
}
