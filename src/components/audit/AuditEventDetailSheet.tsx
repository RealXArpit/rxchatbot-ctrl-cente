import type { AuditLogEvent } from "@/lib/mock-api";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Timestamp } from "@/components/platform/Timestamp";

interface Props {
  event: AuditLogEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditEventDetailSheet({ event, open, onOpenChange }: Props) {
  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Audit Event</SheetTitle>
          <SheetDescription>{event.id}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Row label="Timestamp"><Timestamp date={event.createdAt} fmt="d MMM yyyy HH:mm:ss" /></Row>
          <Row label="Action"><ActionBadge action={event.action} /></Row>
          <Row label="Actor">{event.actorName} ({event.actorId})</Row>
          <Row label="Target Type"><Badge variant="outline">{event.targetType}</Badge></Row>
          <Row label="Target ID"><span className="font-mono text-sm">{event.targetId}</span></Row>
          <Row label="Outcome">
            <span className={event.outcome === "success" ? "text-success" : "text-destructive"}>
              {event.outcome === "success" ? "✅ Success" : "❌ Failure"}
            </span>
          </Row>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Payload</p>
            <pre className="rounded-md border bg-muted/50 p-4 text-xs font-mono overflow-auto max-h-80">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm text-foreground text-right">{children}</span>
    </div>
  );
}

const actionColors: Record<string, string> = {
  KB_PUSH: "bg-primary/15 text-primary",
  KB_DEPRECATE: "bg-destructive/15 text-destructive",
  AGENT_REPLY: "bg-accent text-accent-foreground",
  AGENT_TAKEOVER: "bg-warning/15 text-warning",
  AGENT_RESOLVE: "bg-success/15 text-success",
  FEEDBACK_SUBMIT: "bg-secondary text-secondary-foreground",
  CONFIG_PROPOSE: "bg-primary/15 text-primary",
  CONFIG_APPROVE: "bg-success/15 text-success",
  CONFIG_PUBLISH: "bg-success/15 text-success",
  CONFIG_ROLLBACK: "bg-warning/15 text-warning",
  USER_LOGIN: "bg-muted text-muted-foreground",
  USER_LOGOUT: "bg-muted text-muted-foreground",
};

function ActionBadge({ action }: { action: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionColors[action] ?? "bg-muted text-muted-foreground"}`}>
      {action.replace(/_/g, " ")}
    </span>
  );
}
