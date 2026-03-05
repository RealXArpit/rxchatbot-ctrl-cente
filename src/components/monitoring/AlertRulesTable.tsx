import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/platform/StatusPill";
import { ThresholdPill } from "./ThresholdPill";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Search, Plus } from "lucide-react";
import { Timestamp } from "@/components/platform/Timestamp";
import type { AlertRule } from "@/lib/mock-monitoring";
import { METRIC_OPTIONS } from "@/lib/mock-monitoring";

interface AlertRulesTableProps {
  rules: AlertRule[];
  canEdit: boolean;
  onToggle: (ruleId: string, enabled: boolean) => void;
  onEdit: (ruleId: string) => void;
  onCreate: () => void;
}

export function AlertRulesTable({ rules, canEdit, onToggle, onEdit, onCreate }: AlertRulesTableProps) {
  const [search, setSearch] = useState("");
  const filtered = rules.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.metric.toLowerCase().includes(search.toLowerCase())
  );

  const metricLabel = (m: string) => METRIC_OPTIONS.find((o) => o.value === m)?.label ?? m;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search rules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        {canEdit && (
          <Button size="sm" onClick={onCreate} className="h-8 gap-1">
            <Plus className="h-3.5 w-3.5" /> New Rule
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Metric</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No alert rules found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const sevVariant = r.severity === "critical" ? "danger" : r.severity === "warning" ? "warning" : "muted";
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => onEdit(r.id)}>
                    <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{metricLabel(r.metric)}</TableCell>
                    <TableCell><ThresholdPill operator={r.operator} threshold={r.threshold} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.window}</TableCell>
                    <TableCell><StatusPill label={r.severity} variant={sevVariant} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={r.enabled}
                        onCheckedChange={(v) => onToggle(r.id, v)}
                        disabled={!canEdit}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(r.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
