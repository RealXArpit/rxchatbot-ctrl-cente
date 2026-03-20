import { useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/platform/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import {
  getEscalationById, assignTicket, addNote, addReply, resolveTicket,
  type EscalationTicket,
} from "@/lib/mock-escalations";
import { useEscalationById, useUpdateEscalationStatus } from "@/hooks/useEscalations";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";
import { SlaTimer } from "@/components/escalations/SlaTimer";
import { AssignmentPanel } from "@/components/escalations/AssignmentPanel";
import { InternalNotes } from "@/components/escalations/InternalNotes";
import { ResolutionForm } from "@/components/escalations/ResolutionForm";
import { TakeoverShell } from "@/components/escalations/TakeoverShell";
import { CreateKbFromTicketButton } from "@/components/escalations/CreateKbFromTicketButton";
import { AgentReplyForm } from "@/components/escalations/AgentReplyForm";
import { AgentPollBanner } from "@/components/escalations/AgentPollBanner";
import { toast } from "sonner";
import type { Role } from "@/lib/mock-api";

const priorityColor: Record<string, string> = {
  P0: "bg-destructive text-destructive-foreground",
  P1: "bg-warning text-warning-foreground",
  P2: "bg-muted text-muted-foreground",
};

const CAN_REPLY_ROLES: Role[] = ["SupportAgent", "OpsManager", "SuperAdmin"];

export default function EscalationDetailPage() {
  const { ticketId, env } = useParams<{ ticketId: string; env: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const role = session?.user.role;
  const isAuditor = role === "Auditor";
  const canReply = CAN_REPLY_ROLES.includes(role as Role);
  const canResolve = canReply;

  const { data: liveTicket, isLoading: ticketLoading, refetch } = useEscalationById(ticketId);
  const updateStatus = useUpdateEscalationStatus();
  const [mockTicket] = useState<EscalationTicket | null>(() => getEscalationById(ticketId ?? ""));
  const ticket = liveTicket ?? mockTicket;
  const [lastSent, setLastSent] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (ticketLoading && !ticket) {
    return <div className="p-6"><LoadingSkeleton /></div>;
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <PageHeader title="Ticket Not Found" subtitle="This escalation ticket does not exist." />
        <Button variant="outline" onClick={() => navigate(`/realx/${env}/escalations`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Escalations
        </Button>
      </div>
    );
  }

  const handleAssign = (assigneeId: string, assigneeName: string) => {
    if (liveTicket) {
      updateStatus.mutate(
        { id: ticket.id, assigned_to: assigneeId, status: 'IN_PROGRESS' },
        {
          onSuccess: () => { refresh(); toast.success(`Assigned to ${assigneeName}`); },
          onError: () => toast.error("Failed to assign"),
        }
      );
    } else {
      assignTicket(ticket.id, assigneeId, assigneeName);
      refresh();
      toast.success(`Assigned to ${assigneeName}`);
    }
  };

  const handleAddNote = (text: string) => {
    addNote(ticket.id, session!.user.id, session!.user.name, text);
    refresh();
    toast.success("Note added");
  };

  const handleReply = (text: string) => {
    addReply(ticket.id, session!.user.id, session!.user.name, text);
    refresh();
    toast.success("Reply sent");
  };

  const handleResolve = (note: string, outcome: string) => {
    if (liveTicket) {
      updateStatus.mutate(
        {
          id: ticket.id,
          status: 'RESOLVED',
          resolution_note: note,
          outcome,
          resolved_at: new Date().toISOString(),
        },
        {
          onSuccess: () => { refresh(); toast.success("Ticket resolved"); },
          onError: () => toast.error("Failed to resolve"),
        }
      );
    } else {
      resolveTicket(ticket.id, note, outcome);
      refresh();
      toast.success("Ticket resolved");
    }
  };

  const handleAgentSuccess = (op: string) => {
    setLastSent(new Date());
    if (op === "RESOLVE") {
      handleResolve("Resolved via agent intervention", "RESOLVED");
    }
  };

  return (
    <div>
      <div className="px-6 pt-4 pb-2">
        <Button variant="ghost" size="sm" className="gap-1 mb-2 text-xs" onClick={() => navigate(`/realx/${env}/escalations`)}>
          <ArrowLeft className="h-3.5 w-3.5" /> Escalations
        </Button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-semibold text-foreground">{ticket.id}</h1>
          <Badge className={priorityColor[ticket.priority]}>{ticket.priority}</Badge>
          <Badge variant="outline">{ticket.status.replace("_", " ")}</Badge>
          <Badge variant="outline" className="text-xs">{ticket.channel}</Badge>
        </div>
      </div>

      <div className="px-6 py-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Reason</span><span>{ticket.reason.replace(/_/g, " ")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Assignee</span><span>{ticket.assigneeName ?? "Unassigned"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Session</span><span className="font-mono text-[10px] truncate max-w-[140px]">{ticket.sessionId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Escalated</span><span className="tabular-nums">{new Date(ticket.escalatedAt).toLocaleString()}</span></div>
              {ticket.firstAgentReplyAt && <div className="flex justify-between"><span className="text-muted-foreground">First Reply</span><span className="tabular-nums">{new Date(ticket.firstAgentReplyAt).toLocaleString()}</span></div>}
              {ticket.resolvedAt && <div className="flex justify-between"><span className="text-muted-foreground">Resolved</span><span className="tabular-nums">{new Date(ticket.resolvedAt).toLocaleString()}</span></div>}
              <div className="pt-2">
                <Link to={`/realx/${env}/chat-logs/${ticket.conversationId}`} className="text-primary text-xs flex items-center gap-1 hover:underline">
                  <ExternalLink className="h-3 w-3" /> View Conversation
                </Link>
              </div>
              <div>
                <Link to={`/realx/${env}/audit`} className="text-primary text-xs flex items-center gap-1 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Audit Trail
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">SLA</CardTitle></CardHeader>
            <CardContent><SlaTimer ticket={ticket} /></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Assignment</CardTitle></CardHeader>
            <CardContent>
              <AssignmentPanel ticket={ticket} onAssign={handleAssign} />
            </CardContent>
          </Card>

          <div className="flex gap-2 flex-wrap">
            <CreateKbFromTicketButton
              ticketId={ticket.id}
              sessionId={ticket.sessionId}
              escalationId={ticket.id}
              status={ticket.status}
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <TakeoverShell
            replies={ticket.replies}
            onReply={handleReply}
            readOnly={isAuditor || !canReply}
            sessionId={ticket.sessionId}
            ticketId={ticket.id}
          />

          {lastSent && <AgentPollBanner sessionId={ticket.sessionId} sentAt={lastSent} />}

          {canReply && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
            <AgentReplyForm
              ticketId={ticket.id}
              sessionId={ticket.sessionId}
              onSuccess={handleAgentSuccess}
            />
          )}

          <InternalNotes notes={ticket.notes} onAdd={handleAddNote} readOnly={isAuditor} />
          {canResolve && <ResolutionForm ticket={ticket} onResolve={handleResolve} />}
          {isAuditor && ticket.status !== "RESOLVED" && (
            <p className="text-xs text-muted-foreground italic">View-only access. Contact an agent or manager to resolve.</p>
          )}
        </div>
      </div>
    </div>
  );
}
