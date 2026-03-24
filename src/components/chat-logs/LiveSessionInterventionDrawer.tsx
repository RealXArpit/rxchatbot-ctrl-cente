import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { LiveSession } from "@/hooks/useLiveSessions";
import { formatDistanceToNow } from "date-fns";

interface Props {
  session: LiveSession | null;
  onClose: () => void;
}

function mapRole(role: string): "user" | "bot" | "agent" | null {
  if (role === "user") return "user";
  if (role === "assistant") return "bot";
  if (role === "agent") return "agent";
  if (role === "system") return null;
  return "bot";
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

  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  // Initial load
  useEffect(() => {
    if (!session?.session_id) return;
    seenIds.current.clear();
    setRealtimeMessages([]);
    supabase
      .from('sessions')
      .select('id, session_id, role, message, turn, timestamp')
      .eq('session_id', session.session_id)
      .order('turn', { ascending: true })
      .then(({ data }) => {
        if (data) {
          data.forEach(r => seenIds.current.add(r.id));
          setRealtimeMessages(data);
        }
      });
  }, [session?.session_id]);

  // Realtime subscription
  useEffect(() => {
    if (!session?.session_id) return;
    const channel = supabase
      .channel(`drawer-${session.session_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sessions',
        filter: `session_id=eq.${session.session_id}`,
      }, (payload) => {
        const row = payload.new as any;
        if (seenIds.current.has(row.id)) return;
        seenIds.current.add(row.id);
        setRealtimeMessages(prev => [...prev, row]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.session_id]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [realtimeMessages.length]);

  // Reset state on close
  const handleClose = () => {
    setIsTakeover(false);
    setMessage("");
    setSendError(null);
    setSending(false);
    setEndingTakeover(false);
    setRealtimeMessages([]);
    seenIds.current.clear();
    onClose();
  };

  const allMessages = realtimeMessages
    .filter(row => typeof row.message === 'string' && row.message.trim().length > 0)
    .map((row, i) => {
      const mappedRole = mapRole(row.role);
      if (!mappedRole) return null;
      return {
        id: row.id ?? `msg_${i}`,
        role: mappedRole,
        text: row.message,
        createdAt: row.timestamp ?? new Date().toISOString(),
      };
    })
    .filter(Boolean) as { id: string; role: "user" | "bot" | "agent"; text: string; createdAt: string }[];

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
      setMessage("");
    } catch {
      setSendError("Failed to send — check that the Agent Intervention workflow is Published in n8n");
    } finally {
      setSending(false);
    }
  };

  const handleEndTakeover = async () => {
    if (!client || !authSession || !session) return;
    try {
      await client.agentIntervene({
        sessionId: session.session_id,
        agentId: authSession.user.id,
        agentMessage: '',
        operation: 'END_TAKEOVER',
      });
    } catch {
      // Silent — even if this fails, switch back to observation mode
    }
    setIsTakeover(false);
  };

  const roleBubbleClass: Record<string, string> = {
    user: "ml-auto bg-primary text-primary-foreground rounded-2xl rounded-br-sm",
    bot: "mr-auto bg-muted text-muted-foreground rounded-2xl rounded-bl-sm",
    agent: "mr-auto bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 rounded-2xl rounded-bl-sm",
  };

  const roleLabel: Record<string, string> = {
    user: "User",
    bot: "Bot",
    agent: "Agent",
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
