import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EscalationTicket } from "@/lib/mock-escalations";

interface Props {
  ticket: EscalationTicket;
  onResolve: (note: string, outcome: string) => void;
}

export function ResolutionForm({ ticket, onResolve }: Props) {
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState("RESOLVED");

  if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    return (
      <div className="rounded-md border border-success/30 bg-success/5 p-3 text-xs space-y-1">
        <p className="font-medium text-success">Resolved</p>
        {ticket.resolutionNote && <p className="text-foreground/70">{ticket.resolutionNote}</p>}
        {ticket.resolvedAt && <p className="text-muted-foreground tabular-nums">{new Date(ticket.resolvedAt).toLocaleString()}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <h4 className="text-sm font-medium text-foreground">Resolve Ticket</h4>
      <Select value={outcome} onValueChange={setOutcome}>
        <SelectTrigger className="w-48 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="RESOLVED">Resolved</SelectItem>
          <SelectItem value="DUPLICATE">Duplicate</SelectItem>
          <SelectItem value="NOT_ACTIONABLE">Not Actionable</SelectItem>
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Resolution note..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-[60px] text-xs"
      />
      <Button
        size="sm"
        disabled={!note.trim()}
        onClick={() => onResolve(note.trim(), outcome)}
      >
        Resolve
      </Button>
    </div>
  );
}
