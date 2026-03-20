import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useCuratedKb, useUpdateCuratedKbStatus } from "@/hooks/useCuratedKb";
import type { CuratedKbRow } from "@/hooks/useCuratedKb";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";
import { Timestamp } from "@/components/platform/Timestamp";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Role } from "@/lib/mock-api";

const statusBadge: Record<string, string> = {
  DRAFT:     "bg-warning/10 text-warning border-warning/30",
  PROPOSED:  "bg-warning/10 text-warning border-warning/30",
  PUBLISHED: "bg-success/10 text-success border-success/30",
  ARCHIVED:  "bg-muted text-muted-foreground opacity-60",
  REJECTED:  "bg-destructive/10 text-destructive border-destructive/30",
};

const CAN_PUBLISH: Role[] = ["KnowledgeManager", "OpsManager", "SuperAdmin"];
const CAN_ARCHIVE: Role[] = ["OpsManager", "SuperAdmin"];

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <p className="text-sm">{message}</p>
    </div>
  );
}

function SubTable({
  rows,
  email,
  role,
  emptyMessage,
}: {
  rows: CuratedKbRow[];
  email: string;
  role: Role;
  emptyMessage: string;
}) {
  const updateStatus = useUpdateCuratedKbStatus();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const patch = (id: string, updates: Record<string, unknown>, successMsg: string) => {
    setLoadingId(id);
    updateStatus.mutate(
      { id, updates },
      {
        onSuccess: () => { toast.success(successMsg); setLoadingId(null); },
        onError: (err: any) => { toast.error(err?.message ?? "Update failed"); setLoadingId(null); },
      },
    );
  };

  const patchReject = (id: string) => {
    setLoadingId(id);
    // Try with rejected_by/rejected_at first; if it fails, retry without
    const full = { status: "REJECTED", rejected_by: email, rejected_at: new Date().toISOString() };
    updateStatus.mutate(
      { id, updates: full },
      {
        onSuccess: () => { toast.success("Rejected"); setLoadingId(null); },
        onError: () => {
          // Column might not exist — retry with just status
          updateStatus.mutate(
            { id, updates: { status: "REJECTED" } },
            {
              onSuccess: () => { toast.success("Rejected"); setLoadingId(null); },
              onError: (err: any) => { toast.error(err?.message ?? "Update failed"); setLoadingId(null); },
            },
          );
        },
      },
    );
  };

  if (rows.length === 0) return <EmptyState message={emptyMessage} />;

  const renderActions = (row: CuratedKbRow) => {
    const busy = loadingId === row.id;
    const spinner = busy && <Loader2 className="h-3 w-3 animate-spin" />;

    if (row.status === "DRAFT" && row.created_by === email) {
      return (
        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" disabled={busy}
          onClick={(e) => { e.stopPropagation(); patch(row.id, { status: "PROPOSED", proposed_by: email }, "Proposed for review"); }}>
          {spinner} Propose
        </Button>
      );
    }

    if (row.status === "PROPOSED") {
      const canPublish = row.proposed_by !== email && CAN_PUBLISH.includes(role);
      return (
        <div className="flex gap-1.5 flex-wrap">
          {canPublish && (
            <Button size="sm" className="text-xs h-7 gap-1" disabled={busy}
              onClick={(e) => { e.stopPropagation(); patch(row.id, { status: "PUBLISHED", published_by: email, published_at: new Date().toISOString() }, "Published"); }}>
              {spinner} Publish
            </Button>
          )}
          <Button size="sm" variant="destructive" className="text-xs h-7 gap-1" disabled={busy}
            onClick={(e) => { e.stopPropagation(); patchReject(row.id); }}>
            {spinner} Reject
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" disabled={busy}
            onClick={(e) => { e.stopPropagation(); patch(row.id, { status: "DRAFT", proposed_by: null }, "Sent back to Draft"); }}>
            {spinner} Back to Draft
          </Button>
        </div>
      );
    }

    if (row.status === "PUBLISHED" && CAN_ARCHIVE.includes(role)) {
      return (
        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" disabled={busy}
          onClick={(e) => { e.stopPropagation(); patch(row.id, { status: "ARCHIVED", archived_by: email, archived_at: new Date().toISOString() }, "Archived"); }}>
          {spinner} Archive
        </Button>
      );
    }

    if (row.status === "REJECTED") {
      return (
        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" disabled={busy}
          onClick={(e) => { e.stopPropagation(); patch(row.id, { status: "DRAFT", proposed_by: null }, "Sent back to Draft"); }}>
          {spinner} Back to Draft
        </Button>
      );
    }

    return null;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Question</TableHead>
          <TableHead>Answer</TableHead>
          <TableHead className="w-28">Status</TableHead>
          <TableHead className="w-36">Created By</TableHead>
          <TableHead className="w-36">Created At</TableHead>
          <TableHead className="w-40">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <> 
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
            >
              <TableCell className="text-xs max-w-[200px]">{truncate(row.question, 80)}</TableCell>
              <TableCell className="text-xs max-w-[200px] text-muted-foreground">{truncate(row.answer, 80)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={statusBadge[row.status] ?? ""}>{row.status}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground truncate max-w-[140px]">{row.created_by ?? "—"}</TableCell>
              <TableCell className="text-xs"><Timestamp date={row.created_at} /></TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>{renderActions(row)}</TableCell>
            </TableRow>
            {expandedId === row.id && (
              <TableRow key={`${row.id}_exp`}>
                <TableCell colSpan={6} className="bg-muted/30 px-4 py-3">
                  <div className="space-y-2 text-xs">
                    <div><span className="font-medium">Full Question:</span> <span className="text-foreground/80">{row.question}</span></div>
                    <div><span className="font-medium">Full Answer:</span> <span className="text-foreground/80 whitespace-pre-line">{row.answer}</span></div>
                    {row.escalation_id && <div><span className="font-medium">Source Escalation:</span> <span className="font-mono text-muted-foreground">{row.escalation_id}</span></div>}
                    <div className="flex gap-6 text-muted-foreground flex-wrap">
                      <span>Created by: {row.created_by ?? "—"}</span>
                      {row.proposed_by && <span>Proposed by: {row.proposed_by}</span>}
                      {row.published_by && <span>Published by: {row.published_by}</span>}
                      {row.archived_by && <span>Archived by: {row.archived_by}</span>}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table>
  );
}

export function CuratedKbTable() {
  const { session } = useAuth();
  const email = session?.user?.email ?? session?.user?.name ?? "";
  const role = session?.user?.role as Role;

  const { data: rows, isLoading } = useCuratedKb();

  const published = useMemo(() => (rows ?? []).filter(r => r.status === "PUBLISHED"), [rows]);
  const proposed = useMemo(() => (rows ?? []).filter(r => r.status === "PROPOSED" || r.status === "DRAFT"), [rows]);
  const archived = useMemo(() => (rows ?? []).filter(r => r.status === "ARCHIVED"), [rows]);
  const rejected = useMemo(() => (rows ?? []).filter(r => r.status === "REJECTED"), [rows]);

  if (isLoading) return <LoadingSkeleton />;

  return (
    <Tabs defaultValue="published" className="space-y-3">
      <TabsList>
        <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
        <TabsTrigger value="proposed">Proposed ({proposed.length})</TabsTrigger>
        <TabsTrigger value="archived">Archived ({archived.length})</TabsTrigger>
        <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="published">
        <SubTable rows={published} email={email} role={role} emptyMessage="No published entries yet" />
      </TabsContent>
      <TabsContent value="proposed">
        <SubTable rows={proposed} email={email} role={role} emptyMessage="No entries awaiting review" />
      </TabsContent>
      <TabsContent value="archived">
        <SubTable rows={archived} email={email} role={role} emptyMessage="No archived entries" />
      </TabsContent>
      <TabsContent value="rejected">
        <SubTable rows={rejected} email={email} role={role} emptyMessage="No rejected entries" />
      </TabsContent>
    </Tabs>
  );
}
