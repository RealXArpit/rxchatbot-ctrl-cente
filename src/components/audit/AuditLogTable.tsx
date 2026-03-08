import { useState, useMemo } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Timestamp } from "@/components/platform/Timestamp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { AuditLogEvent, AuditAction } from "@/lib/mock-api";
import { AuditEventDetailSheet } from "./AuditEventDetailSheet";

const ALL_ACTIONS: AuditAction[] = [
  "KB_PUSH", "KB_DEPRECATE", "AGENT_REPLY", "AGENT_TAKEOVER", "AGENT_RESOLVE",
  "FEEDBACK_SUBMIT", "CONFIG_PROPOSE", "CONFIG_APPROVE", "CONFIG_PUBLISH",
  "CONFIG_ROLLBACK", "USER_LOGIN", "USER_LOGOUT",
];

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

interface Props {
  events: AuditLogEvent[];
}

export function AuditLogTable({ events }: Props) {
  const [actorSearch, setActorSearch] = useState("");
  const [selectedActions, setSelectedActions] = useState<Set<AuditAction>>(new Set(ALL_ACTIONS));
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<AuditLogEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    return events.filter((evt) => {
      if (actorSearch && !evt.actorName.toLowerCase().includes(actorSearch.toLowerCase())) return false;
      if (!selectedActions.has(evt.action)) return false;
      const evtDate = new Date(evt.createdAt);
      if (dateFrom && evtDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (evtDate > endOfDay) return false;
      }
      return true;
    });
  }, [events, actorSearch, selectedActions, dateFrom, dateTo]);

  function toggleAction(action: AuditAction) {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No audit events yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Actions taken in the console will appear here.</p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actor..."
            value={actorSearch}
            onChange={(e) => setActorSearch(e.target.value)}
            className="pl-9 w-48"
          />
        </div>

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("gap-2", dateFrom && "text-foreground")}>
              <CalendarIcon className="h-4 w-4" />
              {dateFrom ? format(dateFrom, "d MMM") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("gap-2", dateTo && "text-foreground")}>
              <CalendarIcon className="h-4 w-4" />
              {dateTo ? format(dateTo, "d MMM") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        {/* Action type filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Actions ({selectedActions.size}/{ALL_ACTIONS.length})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ALL_ACTIONS.map((action) => (
                <label key={action} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedActions.has(action)}
                    onCheckedChange={() => toggleAction(action)}
                  />
                  {action.replace(/_/g, " ")}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {(actorSearch || dateFrom || dateTo || selectedActions.size < ALL_ACTIONS.length) && (
          <Button variant="ghost" size="sm" onClick={() => { setActorSearch(""); setDateFrom(undefined); setDateTo(undefined); setSelectedActions(new Set(ALL_ACTIONS)); }}>
            Clear filters
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target Type</TableHead>
              <TableHead>Target ID</TableHead>
              <TableHead>Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((evt) => (
              <TableRow
                key={evt.id}
                className="cursor-pointer"
                onClick={() => { setSelectedEvent(evt); setSheetOpen(true); }}
              >
                <TableCell><Timestamp date={evt.createdAt} fmt="d MMM yyyy HH:mm" /></TableCell>
                <TableCell className="font-medium">{evt.actorName}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionColors[evt.action] ?? "bg-muted text-muted-foreground"}`}>
                    {evt.action.replace(/_/g, " ")}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{evt.targetType}</TableCell>
                <TableCell className="font-mono text-xs">{evt.targetId}</TableCell>
                <TableCell>{evt.outcome === "success" ? "✅" : "❌"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No events match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AuditEventDetailSheet event={selectedEvent} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
