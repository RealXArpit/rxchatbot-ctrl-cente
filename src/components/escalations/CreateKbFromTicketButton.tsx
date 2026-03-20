import { useState, useEffect } from "react";
import { BookPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { SelectedMessage } from "./TranscriptWithSelection";

interface Props {
  ticketId: string;
  status: string;
  selectedMessages?: SelectedMessage[];
  onSuccess?: () => void;
}

export function CreateKbFromTicketButton({ ticketId, status, selectedMessages = [], onSuccess }: Props) {
  const { session } = useAuth();

  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "RESOLVED" || status === "CLOSED") return null;

  const hasSelection = selectedMessages.length > 0;

  const handleOpen = () => {
    // Pre-fill from selected messages
    const firstUser = selectedMessages.find((m) => m.role === "user");
    const firstAgent = selectedMessages.find((m) => m.role === "agent");
    setQuestion(firstUser?.text ?? "");
    setAnswer(firstAgent?.text ?? "");
    setKeywords("");
    setError(null);
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!question.trim() || !answer.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from("curated_kb").insert({
        question: question.trim(),
        answer: answer.trim(),
        keywords: keywords.trim(),
        escalation_id: ticketId,
        status: "DRAFT",
        created_by: session?.user?.email ?? session?.user?.name ?? "unknown",
        created_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
      toast.success("KB entry created as DRAFT");
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message ?? "Failed to insert — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = question.trim().length > 0 && answer.trim().length > 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        disabled={!hasSelection}
        onClick={handleOpen}
      >
        <BookPlus className="h-3.5 w-3.5" />
        Create KB Item
        {hasSelection && (
          <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 py-0 leading-4">
            {selectedMessages.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create KB Entry from Ticket</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1 block">Question *</Label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter the question"
                rows={2}
                maxLength={500}
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">Answer *</Label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter the answer"
                rows={4}
                maxLength={2000}
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">Keywords</Label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="comma separated"
                className="text-sm"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={!canSubmit || submitting} onClick={handleSubmit}>
              {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
