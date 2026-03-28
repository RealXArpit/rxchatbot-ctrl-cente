import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/platform/StatusPill";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { KnowledgeBaseItem } from "@/lib/mock-kb";
import type { Role } from "@/lib/mock-api";
import { useDeprecateKbItem } from "@/hooks/useKbItems";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const syncVariant: Record<string, "success" | "warning" | "danger" | "muted"> = {
  synced: "success",
  pending: "warning",
  error: "danger",
  never: "muted",
};

const CAN_DEPRECATE: Role[] = ["OpsManager", "SuperAdmin"];

interface Props {
  item: KnowledgeBaseItem;
  onSyncUpdate: (updates: Partial<KnowledgeBaseItem>) => void;
}

export function AdminTrainingPanel({ item, onSyncUpdate }: Props) {
  const { client } = useTenant();
  const { session } = useAuth();
  const role = session?.user.role as Role;
  const [pushing, setPushing] = useState(false);
  const deprecateMutation = useDeprecateKbItem();

  const handlePush = async () => {
    if (!client) return;
    setPushing(true);
    try {
      await client.adminAction({
        operation: "UPDATE_KB_ENTRY",
        kbId: item.id,
        category: item.category,
        question: item.question,
        answer: item.answer,
        keywords: item.keywords.join(", "),
      });
      const now = new Date().toISOString();
      onSyncUpdate({ n8nSyncedAt: now, n8nSyncStatus: "synced" });
      toast.success("Pushed to n8n Knowledge Base");
    } catch {
      onSyncUpdate({ n8nSyncStatus: "error" });
      toast.error("Failed to sync — check that the Admin Training workflow is Published in n8n");
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sync Status */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">n8n Sync Status</h4>
        <div className="flex items-center gap-2">
          <StatusPill label={item.n8nSyncStatus} variant={syncVariant[item.n8nSyncStatus]} />
        </div>
        {item.n8nSyncedAt && (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Last synced: {format(new Date(item.n8nSyncedAt), "d MMM yyyy, HH:mm")}
          </p>
        )}
      </div>

      {/* Push to n8n */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Publish to n8n</h4>
        <Button
          size="sm"
          className="w-full gap-1.5"
          onClick={handlePush}
          disabled={pushing}
        >
          {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Push to Knowledge Base
        </Button>
      </div>

      {/* Deprecate */}
      {CAN_DEPRECATE.includes(role) && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2">
          <h4 className="text-xs font-medium text-destructive uppercase tracking-wide">Danger Zone</h4>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="w-full gap-1.5" disabled={deprecating}>
                {deprecating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Deprecate Entry
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deprecate KB Entry?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark <span className="font-mono">{item.id}</span> as deprecated in n8n. The bot will no longer use this entry for responses.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeprecate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Deprecate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
