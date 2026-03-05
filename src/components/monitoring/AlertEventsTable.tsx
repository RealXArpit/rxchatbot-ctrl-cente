import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/platform/StatusPill";
import { Timestamp } from "@/components/platform/Timestamp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AlertEvent } from "@/lib/mock-monitoring";

interface AlertEventsTableProps {
  events: AlertEvent[];
}

const sevVariant = (s: string) =>
  s === "critical" ? "danger" as const : s === "warning" ? "warning" as const : "muted" as const;

export function AlertEventsTable({ events }: AlertEventsTableProps) {
  const [sevFilter, setSevFilter] = useState("all");

  const filtered = sevFilter === "all" ? events : events.filter((e) => e.severity === sevFilter);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Alert Events</h2>
        <Select value={sevFilter} onValueChange={setSevFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Rule</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Ack</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No alert events found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell><StatusPill label={e.severity} variant={sevVariant(e.severity)} /></TableCell>
                  <TableCell className="text-sm text-foreground max-w-[300px] truncate">{e.message}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.ruleName}</TableCell>
                  <TableCell><Timestamp date={e.createdAt} fmt="d MMM, HH:mm" /></TableCell>
                  <TableCell>
                    <span className={`text-xs ${e.acknowledged ? "text-success" : "text-muted-foreground"}`}>
                      {e.acknowledged ? "Yes" : "—"}
                    </span>
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
