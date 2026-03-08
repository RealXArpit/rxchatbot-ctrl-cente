import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  logId: string;
  onSuccess?: () => void;
}

export function AddReferenceAnswerForm({ logId, onSuccess }: Props) {
  const { client } = useTenant();
  const { session } = useAuth();
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!client || !session || !answer.trim()) return;
    setLoading(true);
    try {
      await client.adminAction({
        operation: "ADD_REFERENCE_ANSWER",
        logId,
        referenceAnswer: answer.trim(),
        reviewerId: session.user.id,
      });
      toast.success("Reference answer saved");
      setAnswer("");
      onSuccess?.();
    } catch {
      toast.error("Failed to save reference answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Reference Answer</Label>
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Provide the correct reference answer…"
        className="text-sm min-h-[80px]"
        disabled={loading}
      />
      <Button size="sm" onClick={handleSubmit} disabled={!answer.trim() || loading}>
        {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
        Save Reference Answer
      </Button>
    </div>
  );
}
