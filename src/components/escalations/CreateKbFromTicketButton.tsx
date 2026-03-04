import { useState } from "react";
import { BookPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

export function CreateKbFromTicketButton({ ticketId }: { ticketId: string }) {
  const { session } = useAuth();
  const role = session?.user.role;
  const canCreate = role === "KnowledgeManager" || role === "SuperAdmin" || role === "OpsManager" || role === "SupportAgent";
  const [open, setOpen] = useState(false);

  if (!canCreate) return null;

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setOpen(true)}>
        <BookPlus className="h-3.5 w-3.5" />
        Create KB Item
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Knowledge Base Item</DialogTitle>
            <DialogDescription>
              This will create a new KB item from ticket {ticketId}. This feature is coming soon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
