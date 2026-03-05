import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface RollbackModalProps {
  open: boolean;
  onClose: () => void;
  versionLabel: string;
  onRollback: (reason: string, ticketRef: string) => void;
}

export function RollbackModal({ open, onClose, versionLabel, onRollback }: RollbackModalProps) {
  const [reason, setReason] = useState("");
  const [ticketRef, setTicketRef] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!reason.trim()) e.reason = "Required";
    if (!ticketRef.trim()) e.ticketRef = "Required (e.g., JIRA-123)";
    setErrors(e);
    if (Object.keys(e).length) return;
    onRollback(reason.trim(), ticketRef.trim());
    setReason("");
    setTicketRef("");
    onClose();
    toast({ title: "Rollback initiated", description: `Version ${versionLabel} rolled back.` });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rollback Version {versionLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this rollback needed?" rows={3} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Ticket Reference</Label>
            <Input value={ticketRef} onChange={(e) => setTicketRef(e.target.value)} placeholder="JIRA-123" />
            {errors.ticketRef && <p className="text-xs text-destructive">{errors.ticketRef}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit}>Rollback</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
