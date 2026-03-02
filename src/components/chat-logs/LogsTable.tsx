import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { StatusPill } from "@/components/platform/StatusPill";
import { Timestamp } from "@/components/platform/Timestamp";
import type { Conversation, ColumnKey } from "@/lib/mock-conversations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function confidenceBandLabel(c: number): { label: string; variant: "success" | "warning" | "danger" } {
  if (c >= 0.72) return { label: "High", variant: "success" };
  if (c >= 0.55) return { label: "Medium", variant: "warning" };
  return { label: "Low", variant: "danger" };
}

interface LogsTableProps {
  items: Conversation[];
  columns: ColumnKey[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

const columnHeaders: Record<ColumnKey, string> = {
  id: "Conversation ID",
  channel: "Channel",
  startedAt: "Started",
  routedTo: "Routed To",
  confidence: "Confidence",
  cacheHit: "Cache Hit",
  citations: "Citations",
  legalHold: "Legal Hold",
  escalationReason: "Escalation Reason",
};

export function LogsTable({ items, columns, page, pageSize, total, onPageChange }: LogsTableProps) {
  const navigate = useNavigate();
  const { env } = useTenant();
  const totalPages = Math.ceil(total / pageSize);

  const renderCell = (conv: Conversation, col: ColumnKey) => {
    switch (col) {
      case "id":
        return (
          <button
            className="text-primary hover:underline text-left font-mono text-xs"
            onClick={() => navigate(`/realx/${env}/chat-logs/${conv.id}`)}
          >
            {conv.id}
          </button>
        );
      case "channel":
        return <span className="text-xs">{conv.channel}</span>;
      case "startedAt":
        return <Timestamp date={conv.startedAt} fmt="d MMM yyyy, HH:mm" />;
      case "routedTo":
        return (
          <StatusPill
            label={conv.routedTo}
            variant={conv.routedTo === "BOT" ? "primary" : "warning"}
          />
        );
      case "confidence": {
        const band = confidenceBandLabel(conv.confidence);
        return (
          <div className="flex items-center gap-1.5">
            <span className="tabular-nums text-xs">{conv.confidence.toFixed(2)}</span>
            <StatusPill label={band.label} variant={band.variant} />
          </div>
        );
      }
      case "cacheHit":
        return (
          <StatusPill
            label={conv.cacheHit ? "Hit" : "Miss"}
            variant={conv.cacheHit ? "success" : "muted"}
          />
        );
      case "citations":
        return (
          <div className="flex gap-1 flex-wrap">
            {conv.citations.map((c, i) => (
              <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                {c}
              </span>
            ))}
            {conv.citations.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
          </div>
        );
      case "legalHold":
        return conv.legalHold ? (
          <StatusPill label="Hold" variant="danger" />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      case "escalationReason":
        return (
          <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
            {conv.escalationReason ?? "—"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead key={col} className="text-xs font-medium whitespace-nowrap">
                  {columnHeaders[col]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-sm text-muted-foreground">
                  No conversations found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            ) : (
              items.map((conv) => (
                <TableRow
                  key={conv.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/realx/${env}/chat-logs/${conv.id}`)}
                >
                  {columns.map((col) => (
                    <TableCell key={col} className="py-2.5" onClick={col === "id" ? (e) => e.stopPropagation() : undefined}>
                      {renderCell(conv, col)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground px-1">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
