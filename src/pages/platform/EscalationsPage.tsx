import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/platform/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { getEscalations } from "@/lib/mock-escalations";
import { EscalationsQueueTabs } from "@/components/escalations/EscalationsQueueTabs";
import { EscalationsTable } from "@/components/escalations/EscalationsTable";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";
import { ErrorPanel } from "@/components/platform/ErrorPanel";
import { useEscalations } from "@/hooks/useEscalations";
import { getUrgency } from "@/lib/escalation-urgency";
import type { EscalationTicket } from "@/lib/mock-escalations";

export default function EscalationsPage() {
  const { env } = useParams<{ env: string }>();
  const { session } = useAuth();
  const [queue, setQueue] = useState<"unassigned" | "mine" | "all">("unassigned");
  const userId = session?.user.id ?? "";

  const { data: liveData, isLoading, error, refetch } = useEscalations();

  const tickets: EscalationTicket[] = useMemo(() => {
    if (liveData && liveData.length > 0) return liveData;
    return getEscalations(env ?? "dev", "all", userId);
  }, [liveData, env, userId]);

  const unassigned = useMemo(() =>
    tickets.filter(t => !t.assigneeId && t.status !== "RESOLVED" && t.status !== "CLOSED"),
    [tickets]);

  const mine = useMemo(() =>
    tickets.filter(t => t.assigneeId === userId),
    [tickets, userId]);

  const displayed = queue === "unassigned" ? unassigned : queue === "mine" ? mine : tickets;

  const criticalCount = useMemo(() =>
    tickets.filter(t => {
      const u = getUrgency(t);
      return u.level === "critical";
    }).length,
  [tickets]);

  const subtitle = criticalCount > 0
    ? `${criticalCount} critical · ${unassigned.length} unassigned · ${tickets.length} total`
    : `Review and resolve escalated conversations. ${unassigned.length} unassigned.`;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Manual Escalations" subtitle="Review and resolve escalated conversations." />
        <div className="px-6 py-4"><LoadingSkeleton /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Manual Escalations" subtitle="Review and resolve escalated conversations." />
        <div className="px-6 py-4"><ErrorPanel onRetry={() => refetch()} /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Manual Escalations" subtitle={subtitle} />
      <div className="px-6 py-4 space-y-4">
        <EscalationsQueueTabs
          value={queue}
          onChange={setQueue}
          counts={{ unassigned: unassigned.length, mine: mine.length, all: tickets.length }}
        />
        <EscalationsTable tickets={displayed} />
      </div>
    </div>
  );
}
