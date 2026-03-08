import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { X, Trash2, Bug, Send } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { TestChatMessage } from "./TestChatMessage";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TestChatSession } from "@/types/test-chat";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  session: TestChatSession;
  isLoading: boolean;
  showDebug: boolean;
  onSend: (text: string) => Promise<void>;
  onFeedback: (logId: string, vote: 1 | -1) => Promise<void>;
  onClear: () => void;
  onClose: () => void;
  onToggleDebug: () => void;
}

export function TestChatWindow({
  session,
  isLoading,
  showDebug,
  onSend,
  onFeedback,
  onClear,
  onClose,
  onToggleDebug,
}: Props) {
  const { envConfig } = useTenant();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [session.messages.length]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const envLabel = session.env === "prod" ? "PROD" : "DEV";

  return (
    <div className="w-[380px] h-[560px] bg-card border border-border rounded-xl shadow-lg flex flex-col overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate">🧪 Admin Test Chat</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 shrink-0",
              session.env === "prod"
                ? "border-destructive/40 text-destructive"
                : "border-warning/40 text-warning"
            )}
          >
            {envLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onClear} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear session</TooltipContent>
          </Tooltip>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Webhook URL hint */}
      {envConfig && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="px-3 py-1 text-[11px] text-muted-foreground/70 truncate border-b border-border bg-muted/30 cursor-default">
              {envConfig.webhookBaseUrl.length > 42
                ? envConfig.webhookBaseUrl.slice(0, 42) + "…"
                : envConfig.webhookBaseUrl}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs break-all text-xs">
            {envConfig.webhookBaseUrl}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {session.messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center px-6">
            Ask anything — this goes directly to your live n8n workflow
          </div>
        )}
        {session.messages.map((msg) => (
          <TestChatMessage
            key={msg.id}
            message={msg}
            showDebug={showDebug}
            onFeedback={onFeedback}
          />
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-2 bg-card shrink-0">
        <div className="flex items-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleDebug}
                className={cn(
                  "p-1.5 rounded-md transition-colors shrink-0 mb-0.5",
                  showDebug
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Bug className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Toggle debug info</TooltipContent>
          </Tooltip>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-h-[72px] overflow-y-auto"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0 mb-0.5"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
