import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/platform/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { getEscalations } from "@/lib/mock-escalations";
import { EscalationsQueueTabs } from "@/components/escalations/EscalationsQueueTabs";
import { EscalationsTable } from "@/components/escalations/EscalationsTable";

export default function EscalationsPage() {
  const { env } = useParams<{ env: string }>();
  const { session } = useAuth();
  const [queue, setQueue] = useState<"unassigned" | "mine" | "all">("unassigned");

  const userId = session?.user.id ?? "";

  const allTickets = useMemo(() => getEscalations(env ?? "dev", "all", userId), [env, userId]);
  const unassignedTickets = useMemo(() => getEscalations(env ?? "dev", "unassigned", userId), [env, userId]);
  const myTickets = useMemo(() => getEscalations(env ?? "dev", "mine", userId), [env, userId]);

  const displayed = queue === "unassigned" ? unassignedTickets : queue === "mine" ? myTickets : allTickets;

  return (
    <div>
      <PageHeader title="Manual Escalations" subtitle="Review and resolve escalated conversations." />
      <div className="px-6 py-4 space-y-4">
        <EscalationsQueueTabs
          value={queue}
          onChange={setQueue}
          counts={{ unassigned: unassignedTickets.length, mine: myTickets.length, all: allTickets.length }}
        />
        <EscalationsTable tickets={displayed} />
      </div>
    </div>
  );
}
