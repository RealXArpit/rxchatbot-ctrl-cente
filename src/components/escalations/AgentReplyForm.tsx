import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentInterventionRequest } from "@/types/n8n-responses";

type Operation = "REPLY" | "TAKEOVER" | "RESOLVE";

interface Props {
  ticketId: string;
  sessionId: string;
  onSuccess?: (op: Operation) => void;
}

const opConfig: Record<Operation, { label: string; btnLabel: string; btnClass: string; warning?: string }> = {
  REPLY: { label: "Reply", btnLabel: "Send Reply", btnClass: "bg-primary hover:bg-primary/90 text-primary-foreground" },
  TAKEOVER: { label: "Takeover", btnLabel: "Take Over Session", btnClass: "bg-warning hover:bg-warning/90 text-warning-foreground", warning: "This will mark you as the active agent for this session." },
  RESOLVE: { label: "Resolve", btnLabel: "Mark Resolved", btnClass: "bg-success hover:bg-success/90 text-success-foreground" },
};

export function AgentReplyForm({ ticketId, sessionId, onSuccess }: Props) {
  const { client } = useTenant();
  const { session } = useAuth();
  const [op, setOp] = useState<Operation>("REPLY");
  const [message, setMessage] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [loading, setLoading] = useState(false);

  const cfg = opConfig[op];

  const handleSubmit = async () => {
    if (!client || !session) return;
    const text = message.trim();
    if (!text && op !== "RESOLVE") return;

    setLoading(true);
    try {
      const payload: AgentInterventionRequest = {
        sessionId,
        agentId: session.user.id,
        agentMessage: text || `[${op}]`,
        operation: op,
        ticketId,
        ...(op === "RESOLVE" && resolutionNote.trim() ? { resolutionNote: resolutionNote.trim() } : {}),
      };
      await client.agentIntervene(payload);
      toast.success("Agent message sent to session");
      setMessage("");
      setResolutionNote("");
      onSuccess?.(op);
    } catch {
      toast.error("Failed to send — check that the Agent Intervention workflow is Published in n8n");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-3 py-2.5 border-b border-border">
        <h4 className="text-sm font-medium">Send Agent Reply</h4>
      </div>
      <div className="p-3 space-y-3">
        <Tabs value={op} onValueChange={(v) => setOp(v as Operation)}>
          <TabsList className="h-8">
            <TabsTrigger value="REPLY" className="text-xs">Reply</TabsTrigger>
            <TabsTrigger value="TAKEOVER" className="text-xs">Takeover</TabsTrigger>
            <TabsTrigger value="RESOLVE" className="text-xs">Resolve</TabsTrigger>
          </TabsList>
        </Tabs>

        {cfg.warning && (
          <p className="text-xs text-warning bg-warning/10 rounded-md px-2.5 py-1.5">{cfg.warning}</p>
        )}

        <Textarea
          placeholder={op === "RESOLVE" ? "Final message to user (optional)…" : "Type your message…"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          className="min-h-[60px] text-sm"
        />

        {op === "RESOLVE" && (
          <Textarea
            placeholder="Resolution note (internal)…"
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            disabled={loading}
            className="min-h-[40px] text-sm"
          />
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading || (!message.trim() && op !== "RESOLVE")}
          className={cn("w-full", cfg.btnClass)}
        >
          {loading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          {cfg.btnLabel}
        </Button>
      </div>
    </div>
  );
}
