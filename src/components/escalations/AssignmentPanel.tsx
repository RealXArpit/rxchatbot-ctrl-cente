import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getMockUsers } from "@/lib/mock-auth";
import type { EscalationTicket } from "@/lib/mock-escalations";

interface Props {
  ticket: EscalationTicket;
  onAssign: (assigneeId: string, assigneeName: string) => void;
}

export function AssignmentPanel({ ticket, onAssign }: Props) {
  const { session } = useAuth();
  const role = session?.user.role;
  const canAssignAnyone = role === "SuperAdmin" || role === "OpsManager";
  const canSelfAssign = role === "SupportAgent";
  const [selected, setSelected] = useState(ticket.assigneeId ?? "");

  if (!canAssignAnyone && !canSelfAssign) return null;

  const users = getMockUsers().filter((u) =>
    u.role === "SupportAgent" || u.role === "OpsManager" || u.role === "SuperAdmin"
  );

  if (canSelfAssign && !canAssignAnyone) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={ticket.assigneeId === session?.user.id}
        onClick={() => onAssign(session!.user.id, session!.user.name)}
      >
        {ticket.assigneeId === session?.user.id ? "Assigned to you" : "Assign to me"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="w-48 h-8 text-xs">
          <SelectValue placeholder="Select assignee" />
        </SelectTrigger>
        <SelectContent>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        disabled={!selected || selected === ticket.assigneeId}
        onClick={() => {
          const u = users.find((u) => u.id === selected);
          if (u) onAssign(u.id, u.name);
        }}
      >
        Assign
      </Button>
    </div>
  );
}
