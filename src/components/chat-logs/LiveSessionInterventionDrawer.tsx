import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Zap } from "lucide-react";
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

  const [isTakeover, setIsTakeover] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [endingTakeover, setEndingTakeover] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, dataUpdatedAt, refetch } = useSessionTranscript(session?.session_id);

  // Auto-scroll on new data
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dataUpdatedAt]);

  // Reset state on close
  const handleClose = () => {
    setIsTakeover(false);
    setMessage("");
    setSendError(null);
    setSending(false);
    setEndingTakeover(false);
    onClose();
  };

  // Merge server + optimistic, deduplicate by id, sort by createdAt
  const allMessages = useMemo(() => {
    const serverIds = new Set((serverMessages ?? []).map((m) => m.id));
    const merged = [
      ...(serverMessages ?? []),
      ...optimisticMessages.filter((m) => !serverIds.has(m.id)),
    ];
    return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [serverMessages, optimisticMessages]);

  const isStale = session
    ? Date.now() - new Date(session.last_message_at).getTime() > 10 * 60 * 1000
    : false;

  const isActive = session?.is_active ?? false;

  const handleTakeOver = () => {
    setIsTakeover(true);
    setSendError(null);
  };

  const handleSend = async () => {
    if (!message.trim() || !client || !authSession || !session) return;
    setSending(true);
    setSendError(null);
    const trimmed = message.trim();
    try {
      await client.agentIntervene({
        sessionId: session.session_id,
        agentId: authSession.user.id,
        agentMessage: trimmed,
        operation: "REPLY",
      });
      // Optimistic append
      setOptimisticMessages((prev) => [
        ...prev,
        {
          id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          conversationId: session.session_id,
          role: "agent" as const,
          text: trimmed,
          textRedacted: trimmed,
          createdAt: new Date().toISOString(),
          piiRedacted: false,
          feedback: null,
          adminReferenceAnswer: null,
        },
      ]);
      setMessage("");
    } catch {
      setSendError("Failed to send — check that the Agent Intervention workflow is Published in n8n");
    } finally {
      setSending(false);
    }
  };

  const handleEndTakeover = async () => {
    if (!client || !authSession || !session) return;
    setEndingTakeover(true);
    try {
      await client.agentIntervene({
        sessionId: session.session_id,
        agentId: authSession.user.id,
        agentMessage: "The bot has resumed. Thank you for your patience.",
        operation: "TAKEOVER",
      });
      toast.success("Takeover ended — bot resumed");
    } catch {
      toast.error("Failed to end takeover");
    } finally {
      setIsTakeover(false);
      setOptimisticMessages([]);
      setMessage("");
      setSendError(null);
      setEndingTakeover(false);
    }
  };

  const roleBubbleClass: Record<string, string> = {
    user: "ml-auto bg-primary text-primary-foreground rounded-2xl rounded-br-sm",
    bot: "mr-auto bg-muted text-muted-foreground rounded-2xl rounded-bl-sm",
    agent: "mr-auto bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 rounded-2xl rounded-bl-sm",
    assistant: "mr-auto bg-muted text-muted-foreground rounded-2xl rounded-bl-sm",
  };

  const roleLabel: Record<string, string> = {
    user: "User",
    bot: "Bot",
    agent: "Agent",
    assistant: "Bot",
  };

  return (
    <Sheet open={!!session} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
        {/* Header */}
        <SheetHeader className="shrink-0 px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base">Live Session</SheetTitle>
            {isActive ? (
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Live</span>
              </span>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
            )}
          </div>
          {session && (
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              {session.session_id} · {session.channel} · last active{" "}
              {formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true })}
            </p>
          )}
        </SheetHeader>

        {/* Stale warning */}
        {isStale && (
          <div className="mx-4 mt-3 px-3 py-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800">
            ⚠️ This session has been inactive for over 10 minutes. The user may have left.
          </div>
        )}

        {/* Takeover banner */}
        {isTakeover && (
          <div className="mx-4 mt-3 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 rounded-md border border-amber-300 dark:border-amber-700 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 shrink-0" />
            You are now in this conversation. The bot is paused.
          </div>
        )}

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 space-y-3">
          {allMessages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No messages yet.</p>
          )}
          {allMessages.map((msg) => (
            <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "items-end ml-auto" : "items-start mr-auto"}`}>
              <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                {roleLabel[msg.role] ?? msg.role} · {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
              <div className={`px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${roleBubbleClass[msg.role] ?? roleBubbleClass.bot}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Bottom area */}
        <div className="shrink-0 border-t border-border px-4 py-3">
          {!isTakeover ? (
            /* Stage 1: Observation — Take Over button */
            <div className="flex flex-col items-center gap-2">
              {isActive && (
                <>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    onClick={handleTakeOver}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Take Over This Chat
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center leading-snug max-w-xs">
                    Taking over lets you reply directly. The bot will not respond until you end the takeover.
                  </p>
                </>
              )}
            </div>
          ) : (
            /* Stage 2: Intervention — Reply area */
            <div className="space-y-2">
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
              {sendError && (
                <p className="text-xs text-destructive">{sendError}</p>
              )}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  disabled={endingTakeover}
                  onClick={handleEndTakeover}
                >
                  {endingTakeover && <Loader2 className="h-3 w-3 animate-spin" />}
                  End Takeover
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
