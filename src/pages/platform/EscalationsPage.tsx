import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/platform/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useEscalations } from "@/hooks/useEscalations";
import { getEscalations } from "@/lib/mock-escalations";
import { EscalationsQueueTabs } from "@/components/escalations/EscalationsQueueTabs";
import { EscalationsTable } from "@/components/escalations/EscalationsTable";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EscalationsPage() {
  const { env } = useParams<{ env: string }>();
  const { session } = useAuth();
  const [queue, setQueue] = useState<"unassigned" | "mine" | "all">("unassigned");
  const userId = session?.user.id ?? "";

  const { data: liveData, isLoading, error, refetch, isFetching } = useEscalations(queue, userId);

  // Fall back to mock only when Supabase returns nothing
  const hasLiveData = liveData && liveData.length > 0;
  const mockAll        = getEscalations(env ?? "dev", "all", userId);
  const mockUnassigned = getEscalations(env ?? "dev", "unassigned", userId);
  const mockMine       = getEscalations(env ?? "dev", "mine", userId);

  const displayed = hasLiveData ? liveData : (
    queue === "unassigned" ? mockUnassigned : queue === "mine" ? mockMine : mockAll
  );

  // Counts for tabs — use live data totals when available
  const { data: allData }        = useEscalations("all", userId);
  const { data: unassignedData } = useEscalations("unassigned", userId);
  const { data: mineData }       = useEscalations("mine", userId);

  const counts = {
    unassigned: unassignedData?.length ?? mockUnassigned.length,
    mine:       mineData?.length       ?? mockMine.length,
    all:        allData?.length        ?? mockAll.length,
  };

  return (
    <div>
      <PageHeader
        title="Manual Escalations"
        subtitle="Review and resolve escalated conversations."
        actions={
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />
      <div className="px-6 py-4 space-y-4">
        <EscalationsQueueTabs
          value={queue}
          onChange={setQueue}
          counts={counts}
        />
        {isLoading ? (
          <LoadingSkeleton />
        ) : error && !hasLiveData ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Could not load live escalations. Showing cached data.
          </div>
        ) : (
          <EscalationsTable tickets={displayed} />
        )}
      </div>
    </div>
  );
}
