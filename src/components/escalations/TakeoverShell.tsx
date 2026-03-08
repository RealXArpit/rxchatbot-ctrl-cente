import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChannelConnectionBanner } from "./ChannelConnectionBanner";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { AgentReply } from "@/lib/mock-escalations";

interface Props {
  replies: AgentReply[];
  onReply: (text: string) => void;
  readOnly?: boolean;
  sessionId?: string;
  ticketId?: string;
}

export function TakeoverShell({ replies, onReply, readOnly, sessionId, ticketId }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { client } = useTenant();
  const { session } = useAuth();

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg) return;

    // Try n8n first, fallback to mock
    if (client && session && sessionId) {
      setSending(true);
      try {
        await client.agentIntervene({
          sessionId,
          agentId: session.user.id,
          agentMessage: msg,
          operation: "REPLY",
          ticketId,
        });
        toast.success("Agent message sent to session");
      } catch {
        toast.error("n8n unreachable — saved locally");
      } finally {
        setSending(false);
      }
    }

    onReply(msg);
    setText("");
  };

  return (
    <div className="flex flex-col rounded-md border border-border h-80">
      <div className="px-3 py-2 border-b border-border bg-muted/30">
        <h4 className="text-sm font-medium text-foreground">Takeover Chat</h4>
      </div>
      <ChannelConnectionBanner />
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {replies.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-8">No agent replies yet.</p>
        )}
        {replies.map((r) => (
          <div key={r.id} className="ml-auto max-w-[80%] rounded-lg bg-primary/10 px-3 py-2 text-xs">
            <div className="flex justify-between gap-4 mb-0.5">
              <span className="font-medium text-foreground">{r.authorName}</span>
              <span className="text-muted-foreground tabular-nums">{new Date(r.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-foreground/80">{r.text}</p>
          </div>
        ))}
      </div>
      {!readOnly && (
        <div className="p-2 border-t border-border flex gap-2">
          <Textarea
            placeholder="Reply to user..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            className="min-h-[40px] text-xs"
          />
          <Button
            size="sm"
            disabled={!text.trim() || sending}
            onClick={handleSend}
          >
            {sending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
