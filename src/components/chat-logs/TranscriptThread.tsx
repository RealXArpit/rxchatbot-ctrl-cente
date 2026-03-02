import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/lib/mock-conversations";

interface TranscriptThreadProps {
  messages: Message[];
  showRaw: boolean;
}

export function TranscriptThread({ messages, showRaw }: TranscriptThreadProps) {
  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          role={msg.role}
          text={showRaw ? msg.text : msg.textRedacted}
          createdAt={msg.createdAt}
        />
      ))}
    </div>
  );
}
