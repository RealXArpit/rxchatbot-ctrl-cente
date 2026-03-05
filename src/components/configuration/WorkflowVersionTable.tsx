import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/platform/StatusPill";
import { Timestamp } from "@/components/platform/Timestamp";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { WorkflowVersion } from "@/lib/mock-config";

const statusVariant = (s: string) => {
  if (s === "Published") return "success" as const;
  if (s === "Approved") return "primary" as const;
  if (s === "Proposed") return "warning" as const;
  if (s === "Rolled Back") return "danger" as const;
  return "muted" as const;
};

interface WorkflowVersionTableProps {
  versions: WorkflowVersion[];
  onViewDetail: (versionId: string) => void;
}

export function WorkflowVersionTable({ versions, onViewDetail }: WorkflowVersionTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No versions found.</TableCell>
            </TableRow>
          ) : (
            versions.map((v) => (
              <TableRow key={v.id} className="cursor-pointer" onClick={() => onViewDetail(v.id)}>
                <TableCell className="font-mono text-sm text-foreground">{v.version}</TableCell>
                <TableCell><StatusPill label={v.status} variant={statusVariant(v.status)} /></TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{v.reason}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{v.actorName}</TableCell>
                <TableCell><Timestamp date={v.updatedAt} fmt="d MMM, HH:mm" /></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onViewDetail(v.id); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
