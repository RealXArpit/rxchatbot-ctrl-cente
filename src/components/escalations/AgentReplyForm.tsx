import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { AgentInterventionRequest } from "@/types/n8n-responses";

interface Props {
  ticketId: string;
  sessionId: string;
  onSuccess?: (op: string) => void;
}

export function AgentReplyForm({ ticketId, sessionId, onSuccess }: Props) {
  const { client } = useTenant();
  const { session } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!client || !session) return;
    const text = message.trim();
    if (!text) return;

    setLoading(true);
    try {
      const payload: AgentInterventionRequest = {
        sessionId,
        agentId: session.user.id,
        agentMessage: text,
        operation: "REPLY",
        ticketId,
      };
      await client.agentIntervene(payload);
      toast.success("Agent message sent to session");
      setMessage("");
      onSuccess?.("REPLY");
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
        <Textarea
          placeholder="Type your message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          className="min-h-[60px] text-sm"
        />

        <Button
          onClick={handleSubmit}
          disabled={loading || !message.trim()}
          className="w-full"
        >
          {loading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          Send to User
        </Button>
      </div>
    </div>
  );
}
