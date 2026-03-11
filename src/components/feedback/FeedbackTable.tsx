import { useState } from "react";
import { useFeedbackEvents } from "@/hooks/useFeedback";
import { getFeedbackEvents } from "@/lib/mock-feedback";
import { useAuth } from "@/contexts/AuthContext";
import { StatusPill } from "@/components/platform/StatusPill";
import { Timestamp } from "@/components/platform/Timestamp";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Role } from "@/lib/mock-api";

const CAN_SEE_FULL_SESSION: Role[] = ["SuperAdmin", "OpsManager"];
type Filter = "all" | "positive" | "negative";

export function FeedbackTable() {
  const { session } = useAuth();
  const role = session?.user.role as Role;
  const canSeeSession = CAN_SEE_FULL_SESSION.includes(role);
  const [filter, setFilter] = useState<Filter>("all");
  const [sortDesc, setSortDesc] = useState(true);

  const { data: liveEvents, isLoading } = useFeedbackEvents();
  const allEvents = liveEvents && liveEvents.length > 0 ? liveEvents : getFeedbackEvents();

  let events = [...allEvents];
  if (filter === "positive") events = events.filter((e) => e.feedback === 1);
  if (filter === "negative") events = events.filter((e) => e.feedback === -1);
  if (!sortDesc) events = events.reverse();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="positive" className="text-xs">👍</TabsTrigger>
            <TabsTrigger value="negative" className="text-xs">👎</TabsTrigger>
          </TabsList>
        </Tabs>
        <button
          onClick={() => setSortDesc((p) => !p)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Date {sortDesc ? "↓" : "↑"}
        </button>
      </div>

      {isLoading && <LoadingSkeleton />}

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Session</TableHead>
              <TableHead className="text-xs">User Message</TableHead>
              <TableHead className="text-xs">Feedback</TableHead>
              <TableHead className="text-xs">Confidence</TableHead>
              <TableHead className="text-xs">Routed To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  No feedback collected yet. Users can thumbs up/down answers in the chat widget.
                </TableCell>
              </TableRow>
            ) : (
              events.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="py-2"><Timestamp date={ev.feedbackAt} fmt="d MMM, HH:mm" /></TableCell>
                  <TableCell className="py-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {canSeeSession ? ev.sessionId : ev.sessionId.slice(0, 10) + "…"}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 max-w-[200px]">
                    <span className="text-xs truncate block">{ev.userMessage.slice(0, 60)}{ev.userMessage.length > 60 ? "…" : ""}</span>
                  </TableCell>
                  <TableCell className="py-2">
                    <span className={ev.feedback === 1 ? "text-success text-sm" : "text-destructive text-sm"}>
                      {ev.feedback === 1 ? "👍" : "👎"}
                    </span>
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="tabular-nums text-xs">{ev.confidence.toFixed(2)}</span>
                  </TableCell>
                  <TableCell className="py-2">
                    <StatusPill label={ev.routedTo} variant={ev.routedTo === "BOT" ? "primary" : "warning"} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
