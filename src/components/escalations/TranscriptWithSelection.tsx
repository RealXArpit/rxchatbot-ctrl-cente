import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";
import { useSessionTranscript } from "@/hooks/useSessionTranscript";

export interface SelectedMessage {
  id: string;
  role: "user" | "agent";
  text: string;
}

interface Props {
  sessionId: string;
  selectedMessages: SelectedMessage[];
  onSelectionChange: (messages: SelectedMessage[]) => void;
}

const roleBadge: Record<string, { label: string; className: string }> = {
  user:  { label: "User",  className: "bg-primary/10 text-primary border-primary/30" },
  bot:   { label: "Bot",   className: "bg-muted text-muted-foreground" },
  agent: { label: "Agent", className: "bg-warning/10 text-warning border-warning/30" },
};

export function TranscriptWithSelection({ sessionId, selectedMessages, onSelectionChange }: Props) {
  const { data: messages, isLoading } = useSessionTranscript(sessionId);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectedIds = new Set(selectedMessages.map((m) => m.id));

  const toggleMessage = (id: string, role: string, text: string) => {
    const mappedRole: "user" | "agent" = role === "user" ? "user" : "agent";
    if (selectedIds.has(id)) {
      onSelectionChange(selectedMessages.filter((m) => m.id !== id));
    } else {
      onSelectionChange([...selectedMessages, { id, role: mappedRole, text }]);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Session Transcript</CardTitle></CardHeader>
        <CardContent><LoadingSkeleton /></CardContent>
      </Card>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Session Transcript</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">No transcript available for this session.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Session Transcript</CardTitle>
          {selectedMessages.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {selectedMessages.length} selected
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-80 overflow-y-auto space-y-1">
          {messages.map((msg) => {
            const isSelected = selectedIds.has(msg.id);
            const isHovered = hoveredId === msg.id;
            const badge = roleBadge[msg.role] ?? roleBadge.bot;
            const isSelectable = msg.role === "user" || msg.role === "bot" || msg.role === "agent";

            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-2 rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer
                  ${isSelected ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50 border border-transparent"}`}
                onMouseEnter={() => setHoveredId(msg.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => isSelectable && toggleMessage(msg.id, msg.role, msg.text)}
              >
                <div className={`mt-0.5 transition-opacity ${isSelected || isHovered ? "opacity-100" : "opacity-0"}`}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleMessage(msg.id, msg.role, msg.text)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badge.className}`}>
                      {badge.label}
                    </Badge>
                    <span className="text-muted-foreground text-[10px] tabular-nums">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-foreground/80 whitespace-pre-line break-words">{msg.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
