import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ConfigApprovalFlowProps {
  canPropose: boolean;
  canApprove: boolean;
  canPublish: boolean;
  hasStagedChanges: boolean;
  onPropose: (reason: string) => void;
  pendingProposedId: string | null;
  pendingApprovedId: string | null;
  onApprove: (versionId: string) => void;
  onPublish: (versionId: string) => void;
}

export function ConfigApprovalFlow({
  canPropose, canApprove, canPublish, hasStagedChanges,
  onPropose, pendingProposedId, pendingApprovedId,
  onApprove, onPublish,
}: ConfigApprovalFlowProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handlePropose = () => {
    if (!reason.trim()) {
      toast({ title: "Reason required", variant: "destructive" });
      return;
    }
    onPropose(reason.trim());
    setReason("");
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {canPropose && (
        <Button size="sm" variant="outline" disabled={!hasStagedChanges} onClick={() => setOpen(true)}>
          Propose Changes
        </Button>
      )}
      {canApprove && pendingProposedId && (
        <Button size="sm" variant="secondary" onClick={() => onApprove(pendingProposedId)}>
          Approve Proposed v
        </Button>
      )}
      {canPublish && pendingApprovedId && (
        <Button size="sm" onClick={() => onPublish(pendingApprovedId)}>
          Publish Approved v
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Propose Config Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Reason for change</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe what changed and why…" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handlePropose}>Propose</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
