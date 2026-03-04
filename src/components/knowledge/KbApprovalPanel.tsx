import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import type { KnowledgeBaseItem, KbStatus } from "@/lib/mock-kb";
import { proposeKbItem, approveKbItem, publishKbItem, archiveKbItem } from "@/lib/mock-kb";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Proposed: "bg-warning/10 text-warning border-warning/30",
  Approved: "bg-primary/10 text-primary border-primary/30",
  Published: "bg-success/10 text-success border-success/30",
  Archived: "bg-muted text-muted-foreground",
};

interface Transition {
  label: string;
  target: KbStatus;
  action: (kbId: string, actorId: string, actorName: string, reason: string) => ReturnType<typeof proposeKbItem>;
  allowedRoles: string[];
}

const transitions: Record<string, Transition[]> = {
  Draft: [
    { label: "Propose", target: "Proposed", action: proposeKbItem, allowedRoles: ["KnowledgeManager", "OpsManager", "SuperAdmin"] },
  ],
  Proposed: [
    { label: "Approve", target: "Approved", action: approveKbItem, allowedRoles: ["OpsManager", "SuperAdmin"] },
  ],
  Approved: [
    { label: "Publish", target: "Published", action: publishKbItem, allowedRoles: ["SuperAdmin"] },
  ],
  Published: [
    { label: "Archive", target: "Archived", action: archiveKbItem, allowedRoles: ["SuperAdmin"] },
  ],
};

interface Props {
  item: KnowledgeBaseItem;
  onUpdate: () => void;
}

export function KbApprovalPanel({ item, onUpdate }: Props) {
  const { session } = useAuth();
  const role = session?.user.role ?? "";
  const available = (transitions[item.status] ?? []).filter((t) => t.allowedRoles.includes(role));
  const [modal, setModal] = useState<Transition | null>(null);
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!modal || !session) return;
    modal.action(item.id, session.user.id, session.user.name, reason || `${modal.label} by ${session.user.name}`);
    toast.success(`Item ${modal.label.toLowerCase()}d successfully`);
    setModal(null);
    setReason("");
    onUpdate();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Status:</span>
        <Badge variant="outline" className={statusColor[item.status]}>{item.status}</Badge>
      </div>
      <div className="text-xs text-muted-foreground">
        Pipeline: Draft → Proposed → Approved → Published → Archived
      </div>
      {available.length > 0 && (
        <div className="flex gap-2">
          {available.map((t) => (
            <Button key={t.target} size="sm" variant={t.target === "Published" ? "default" : "outline"} onClick={() => setModal(t)}>
              {t.label}
            </Button>
          ))}
        </div>
      )}

      <Dialog open={!!modal} onOpenChange={(open) => { if (!open) { setModal(null); setReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{modal?.label} KB Item</DialogTitle>
            <DialogDescription>
              Move "{item.question}" from {item.status} to {modal?.target}.
              {modal?.target === "Published" && " This will make the item live."}
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} className="text-xs" maxLength={500} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModal(null); setReason(""); }}>Cancel</Button>
            <Button onClick={handleConfirm}>{modal?.label}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
