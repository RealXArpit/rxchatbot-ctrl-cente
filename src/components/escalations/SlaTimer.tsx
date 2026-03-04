import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EscalationTicket } from "@/lib/mock-escalations";
import { isSlaBreached, getTimeToBreachMinutes } from "@/lib/mock-escalations";

interface SlaTimerProps {
  ticket: EscalationTicket;
  compact?: boolean;
}

export function SlaTimer({ ticket, compact }: SlaTimerProps) {
  const breach = isSlaBreached(ticket);
  const ttb = getTimeToBreachMinutes(ticket);

  if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    return <Badge variant="outline" className="text-xs text-muted-foreground">Resolved</Badge>;
  }

  const frBreached = breach.firstResponse;
  const resBreached = breach.resolution;
  const anyBreach = frBreached || resBreached;

  const formatTime = (mins: number | null) => {
    if (mins === null) return null;
    if (mins <= 0) return "Breached";
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {anyBreach ? (
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertTriangle className="h-3 w-3" />
            Breached
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs gap-1 border-warning text-warning">
            <Clock className="h-3 w-3" />
            {formatTime(ttb.firstResponse ?? ttb.resolution)}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground w-28">First Response:</span>
        {ticket.firstAgentReplyAt ? (
          <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">Met</Badge>
        ) : frBreached ? (
          <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Breached</Badge>
        ) : (
          <Badge variant="outline" className="text-xs border-warning text-warning gap-1">
            <Clock className="h-3 w-3" />{formatTime(ttb.firstResponse)}
          </Badge>
        )}
        <span className="text-muted-foreground">({ticket.sla.firstResponseMinutes}m SLA)</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground w-28">Resolution:</span>
        {ticket.resolvedAt ? (
          <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">Met</Badge>
        ) : resBreached ? (
          <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Breached</Badge>
        ) : (
          <Badge variant="outline" className="text-xs border-warning text-warning gap-1">
            <Clock className="h-3 w-3" />{formatTime(ttb.resolution)}
          </Badge>
        )}
        <span className="text-muted-foreground">({ticket.sla.resolutionHours}h SLA)</span>
      </div>
    </div>
  );
}
