import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw } from "lucide-react";
import { useSessionTranscript } from "@/hooks/useSessionTranscript";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { LiveSession } from "@/hooks/useLiveSessions";
import { formatDistanceToNow } from "date-fns";

interface Props {
  session: LiveSession | null;
  onClose: () => void;
}

export function LiveSessionInterventionDrawer({ session, onClose }: Props) {
  const { client } = useTenant();
  const { session: authSession } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch, dataUpdatedAt } = useSessionTranscript(session?.session_id);

  // Auto-refresh every 10 seconds when drawer is open
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => refetch(), 10000);
    return () => clearInterval(interval);
  }, [session, refetch]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dataUpdatedAt]);

  const handleSend = async () => {
    if (!message.trim() || !client || !authSession || !session) return;
    setSending(true);
    try {
      await client.agentIntervene({
        sessionId: session.session_id,
        agentId: authSession.user.id,
        agentMessage: message.trim(),
        operation: "REPLY",
      });
      toast.success("Message sent to session");
      setMessage("");
      refetch();
    } catch {
      toast.error("Failed to send — check that the Agent Intervention workflow is Published in n8n");
    } finally {
      setSending(false);
    }
  };

  const isStale = session
    ? Date.now() - new Date(session.last_message_at).getTime() > 10 * 60 * 1000
    : false;

  const roleColors: Record<string, string> = {
    user:      "bg-primary/10 text-primary",
    bot:       "bg-muted text-muted-foreground",
    agent:     "bg-warning/10 text-warning",
    assistant: "bg-muted text-muted-foreground",
  };

  return (
    <Sheet open={!!session} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base">
              Live Session
            </SheetTitle>
            <div>
              {isStale ? (
                <Badge variant="secondary" className="text-[10px]">May be inactive</Badge>
              ) : (
                <Badge className="bg-success text-success-foreground text-[10px]">Active</Badge>
              )}
            </div>
          </div>

          {session && (
            <p className="text-xs text-muted-foreground mt-1">
              {session.session_id} · {session.channel} · last active {formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true })}
            </p>
          )}
        </SheetHeader>

        {isStale && (
          <div className="px-3 py-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800 mt-2">
            ⚠️ This session has been inactive for over 10 minutes. The user may have left.
          </div>
        )}

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4 min-h-0">
          {(!messages || messages.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-8">No messages yet.</p>
          )}
          {(messages ?? []).map((msg) => (
            <div key={msg.id} className="px-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleColors[msg.role] ?? ""}`}>
                  {msg.role}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Reply area */}
        <div className="shrink-0 border-t border-border pt-3 space-y-2">
          <Textarea
            placeholder="Type a reply to send directly into the user's chat…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            className="min-h-[60px] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => refetch()}>
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
            <Button
              size="sm"
              disabled={!message.trim() || sending}
              onClick={handleSend}
            >
              {sending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Send to User
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
