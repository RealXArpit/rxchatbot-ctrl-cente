import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import type { TestChatMessage } from "@/types/test-chat";
import { format } from "date-fns";

interface Props {
  message: TestChatMessage;
  showDebug: boolean;
  onFeedback?: (logId: string, vote: 1 | -1) => void;
}

function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

function DebugMeta({ meta }: { meta: NonNullable<TestChatMessage["meta"]> }) {
  const rows = [
    ["routedTo", meta.routedTo],
    ["confidence", meta.confidence.toFixed(2)],
    ["cacheHit", String(meta.cacheHit)],
    ["citations", meta.citations.length ? meta.citations.join(", ") : "—"],
    ["logId", meta.logId.slice(0, 12) + "…"],
    ...(meta.tokensUsed != null ? [["tokens", String(meta.tokensUsed)]] : []),
    ["timestamp", format(new Date(meta.sessionId ? new Date() : new Date()), "yyyy-MM-dd HH:mm:ss")],
  ];

  return (
    <div className="mt-1.5 rounded-md bg-muted/60 border border-border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground leading-relaxed">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <span className="text-muted-foreground/70 min-w-[90px]">{k}:</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}

export function TestChatMessage({ message, showDebug, onFeedback }: Props) {
  const { role, text, meta, feedback, isLoading } = message;

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3.5 py-2 text-sm">
          {text}
        </div>
      </div>
    );
  }

  if (role === "error") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-destructive/10 text-destructive border border-destructive/30 px-3.5 py-2 text-sm whitespace-pre-line">
          {text}
        </div>
      </div>
    );
  }

  // Bot message
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm">
        {isLoading ? <TypingIndicator /> : text}
      </div>

      {!isLoading && meta && (
        <>
          {/* Feedback buttons */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => feedback == null && onFeedback?.(meta.logId, 1)}
              disabled={feedback != null}
              className={cn(
                "p-1 rounded transition-colors",
                feedback === 1
                  ? "text-success"
                  : feedback != null
                    ? "text-muted-foreground/30"
                    : "text-muted-foreground hover:text-success"
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => feedback == null && onFeedback?.(meta.logId, -1)}
              disabled={feedback != null}
              className={cn(
                "p-1 rounded transition-colors",
                feedback === -1
                  ? "text-destructive"
                  : feedback != null
                    ? "text-muted-foreground/30"
                    : "text-muted-foreground hover:text-destructive"
              )}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Debug panel */}
          {showDebug && <DebugMeta meta={meta} />}
        </>
      )}
    </div>
  );
}
