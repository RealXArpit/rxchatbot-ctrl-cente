import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { InternalNote } from "@/lib/mock-escalations";

interface Props {
  notes: InternalNote[];
  onAdd: (text: string) => void;
  readOnly?: boolean;
}

export function InternalNotes({ notes, onAdd, readOnly }: Props) {
  const [text, setText] = useState("");

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Internal Notes</h4>
      {notes.length === 0 && (
        <p className="text-xs text-muted-foreground">No notes yet.</p>
      )}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {notes.map((n) => (
          <div key={n.id} className="rounded-md border border-border bg-muted/30 p-2.5 text-xs">
            <div className="flex justify-between mb-1">
              <span className="font-medium text-foreground">{n.authorName}</span>
              <span className="text-muted-foreground tabular-nums">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-foreground/80">{n.text}</p>
          </div>
        ))}
      </div>
      {!readOnly && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Add internal note..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[60px] text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!text.trim()}
            onClick={() => { onAdd(text.trim()); setText(""); }}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
