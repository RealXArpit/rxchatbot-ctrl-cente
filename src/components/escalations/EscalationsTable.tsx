import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { EscalationTicket } from "@/lib/mock-escalations";
import { getUrgency, sortByUrgency } from "@/lib/escalation-urgency";

const priorityColor: Record<string, string> = {
  P0: "bg-destructive text-destructive-foreground",
  P1: "bg-warning text-warning-foreground",
  P2: "bg-muted text-muted-foreground",
};

const statusColor: Record<string, string> = {
  OPEN: "bg-destructive/10 text-destructive border-destructive/30",
  IN_PROGRESS: "bg-warning/10 text-warning border-warning/30",
  RESOLVED: "bg-success/10 text-success border-success/30",
  CLOSED: "bg-muted text-muted-foreground",
};

// Ticks every 60 seconds so elapsed times stay live without hammering
// the DB — urgency recalculates client-side from escalatedAt
function useLiveTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
  return tick;
}

interface Props {
  tickets: EscalationTicket[];
}

export function EscalationsTable({ tickets }: Props) {
  const navigate = useNavigate();
  const { env } = useParams<{ env: string }>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tick = useLiveTick(); // causes re-render every 60s to refresh urgency
  const now = new Date();

  const sorted = sortByUrgency(tickets);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No tickets in this queue.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-2">{/* urgency stripe */}</TableHead>
          <TableHead className="w-20">ID</TableHead>
          <TableHead className="w-16">Priority</TableHead>
          <TableHead className="w-28">Status</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead className="w-36">Urgency</TableHead>
          <TableHead className="w-40">Escalated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((t) => {
          const urgency = getUrgency(t, now);
          return (
            <TableRow
              key={t.id}
              className={`cursor-pointer ${urgency.rowClass}`}
              onClick={() => navigate(`/realx/${env}/escalations/${t.id}`)}
            >
              {/* Left urgency stripe — visual anchor for the eye */}
              <TableCell className="w-2 p-0" />

              <TableCell className="font-mono text-xs">
                {t.id.slice(0, 8)}…
              </TableCell>

              <TableCell>
                <Badge className={priorityColor[t.priority]}>
                  {t.priority}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge variant="outline" className={statusColor[t.status]}>
                  {t.status.replace("_", " ")}
                </Badge>
              </TableCell>

              <TableCell className="text-xs">
                {t.reason.replace(/_/g, " ")}
              </TableCell>

              <TableCell className="text-xs">{t.channel}</TableCell>

              <TableCell className="text-xs">
                {t.assigneeName ?? (
                  <span className="text-destructive font-medium">Unassigned</span>
                )}
              </TableCell>

              {/* Urgency cell — replaces old SLA column */}
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <Badge variant="outline" className={urgency.badgeClass}>
                    {urgency.displayTime}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {urgency.level === "critical" && "Critical"}
                    {urgency.level === "attention" && "Needs attention"}
                    {urgency.level === "responding" && "In progress"}
                    {urgency.level === "resolved" && "Resolved"}
                  </span>
                </div>
              </TableCell>

              <TableCell className="text-xs text-muted-foreground tabular-nums">
                {new Date(t.escalatedAt).toLocaleString()}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
