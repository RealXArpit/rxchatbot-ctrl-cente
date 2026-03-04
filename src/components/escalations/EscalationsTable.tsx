import { useNavigate, useParams } from "react-router-dom";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SlaTimer } from "./SlaTimer";
import type { EscalationTicket } from "@/lib/mock-escalations";

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

interface Props {
  tickets: EscalationTicket[];
}

export function EscalationsTable({ tickets }: Props) {
  const navigate = useNavigate();
  const { env } = useParams<{ env: string }>();

  if (tickets.length === 0) {
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
          <TableHead className="w-20">ID</TableHead>
          <TableHead className="w-16">Priority</TableHead>
          <TableHead className="w-28">Status</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead className="w-36">SLA</TableHead>
          <TableHead className="w-40">Escalated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((t) => (
          <TableRow
            key={t.id}
            className="cursor-pointer"
            onClick={() => navigate(`/realx/${env}/escalations/${t.id}`)}
          >
            <TableCell className="font-mono text-xs">{t.id}</TableCell>
            <TableCell>
              <Badge className={priorityColor[t.priority]}>{t.priority}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={statusColor[t.status]}>{t.status.replace("_", " ")}</Badge>
            </TableCell>
            <TableCell className="text-xs">{t.reason.replace(/_/g, " ")}</TableCell>
            <TableCell className="text-xs">{t.channel}</TableCell>
            <TableCell className="text-xs">{t.assigneeName ?? "—"}</TableCell>
            <TableCell><SlaTimer ticket={t} compact /></TableCell>
            <TableCell className="text-xs text-muted-foreground tabular-nums">
              {new Date(t.escalatedAt).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
