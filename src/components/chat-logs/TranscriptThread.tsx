import { MessageBubble } from "./MessageBubble";
import { ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Message } from "@/lib/mock-conversations";

interface TranscriptThreadProps {
  messages: Message[];
  showRaw: boolean;
}

export function TranscriptThread({ messages, showRaw }: TranscriptThreadProps) {
  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div key={msg.id}>
          <MessageBubble
            role={msg.role}
            text={showRaw ? msg.text : msg.textRedacted}
            createdAt={msg.createdAt}
          />

          {/* Read-only feedback display */}
          {msg.role === "bot" && msg.feedback != null && (
            <div className="flex items-center gap-1 ml-9 mt-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={msg.feedback === 1 ? "text-success" : "text-muted-foreground/30"}>
                    <ThumbsUp className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {msg.feedback === 1 ? "User gave thumbs up" : "User feedback"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={msg.feedback === -1 ? "text-destructive" : "text-muted-foreground/30"}>
                    <ThumbsDown className="h-3 w-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {msg.feedback === -1 ? "User gave thumbs down" : "User feedback"}
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Admin Verified chip */}
          {msg.role === "bot" && msg.adminReferenceAnswer && (
            <div className="flex items-center gap-1 ml-9 mt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 text-success px-2 py-0.5 text-[10px] font-semibold">
                <CheckCircle className="h-3 w-3" />
                Admin Verified
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
