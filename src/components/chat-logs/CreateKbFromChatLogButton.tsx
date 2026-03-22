import { useState } from "react";
import { BookPlus, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { SelectedMessage } from "@/components/escalations/TranscriptWithSelection";
import { useUpdateKbItem } from "@/hooks/useKbItems";
import { getKbCategories } from "@/lib/mock-kb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface DuplicateMatch {
  id: string;
  question: string;
  answer: string;
  source: "knowledge_base" | "curated_kb";
}

interface Props {
  sessionId: string;
  selectedMessages?: SelectedMessage[];
  onSuccess?: () => void;
}

const STOP_WORDS = new Set(["what","is","are","the","how","does","do","why","when","can","will","would","should","tell","me","about","a","an","in","on","of","to","for","and","or","but"]);

function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function getSignificantWords(normalized: string): Set<string> {
  return new Set(normalized.split(" ").filter(w => w.length > 3 && !STOP_WORDS.has(w)));
}

function isDuplicate(userQ: string, kbQ: string): boolean {
  const a = normalizeQuestion(userQ);
  const b = normalizeQuestion(kbQ);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aWords = getSignificantWords(a);
  const bWords = getSignificantWords(b);
  if (aWords.size === 0 || bWords.size === 0) return false;
  const overlap = [...aWords].filter(w => bWords.has(w)).length;
  return overlap / Math.max(aWords.size, bWords.size) > 0.6;
}

export function CreateKbFromChatLogButton({ sessionId, selectedMessages = [], onSuccess }: Props) {
  const { session } = useAuth();
  const categories = getKbCategories();
  const updateMutation = useUpdateKbItem();

  // Dialog states
  const [checking, setChecking] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Form state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate state
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateMatch | null>(null);

  // Edit form state (for the drawer)
  const [editCategory, setEditCategory] = useState("");
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const hasSelection = selectedMessages.length > 0;

  const handleOpen = async () => {
    const firstUser = selectedMessages.find((m) => m.role === "user");
    const firstAgent = selectedMessages.find((m) => m.role === "agent");
    const userQuestion = firstUser?.text ?? "";
    const agentAnswer = firstAgent?.text ?? "";

    setQuestion(userQuestion);
    setAnswer(agentAnswer);
    setKeywords("");
    setError(null);

    if (!userQuestion.trim()) {
      setCreateOpen(true);
      return;
    }

    // Check for duplicates
    setChecking(true);
    try {
      const [kbResult, curatedResult] = await Promise.all([
        supabase.from("knowledge_base").select("id, question, answer, status").not("status", "in", '("DEPRECATED","ARCHIVED")'),
        supabase.from("curated_kb").select("id, question, answer, status").not("status", "in", '("ARCHIVED","REJECTED")'),
      ]);

      const matches: DuplicateMatch[] = [];

      for (const row of kbResult.data ?? []) {
        if (row.question && isDuplicate(userQuestion, row.question)) {
          matches.push({ id: row.id, question: row.question, answer: row.answer ?? "", source: "knowledge_base" });
        }
      }
      for (const row of curatedResult.data ?? []) {
        if (row.question && isDuplicate(userQuestion, row.question)) {
          matches.push({ id: row.id, question: row.question, answer: row.answer ?? "", source: "curated_kb" });
        }
      }

      if (matches.length > 0) {
        setDuplicates(matches);
        setSelectedDuplicate(matches[0]);
        setDuplicateOpen(true);
      } else {
        setCreateOpen(true);
      }
    } catch (err) {
      // On network error, proceed to create dialog
      setCreateOpen(true);
    } finally {
      setChecking(false);
    }
  };

  const handleOpenEdit = (match: DuplicateMatch) => {
    setSelectedDuplicate(match);
    setEditCategory("");
    setEditQuestion(match.question);
    setEditAnswer(match.answer);
    setEditKeywords("");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDuplicate || !editQuestion.trim() || !editAnswer.trim()) return;
    setEditSubmitting(true);
    try {
      if (selectedDuplicate.source === "knowledge_base") {
        const { error } = await supabase.from("knowledge_base").update({
          question: editQuestion.trim(),
          answer: editAnswer.trim(),
          keywords: editKeywords.trim() || undefined,
          ...(editCategory ? { category: editCategory } : {}),
          updated_at: new Date().toISOString(),
        }).eq("id", selectedDuplicate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("curated_kb").update({
          question: editQuestion.trim(),
          answer: editAnswer.trim(),
          keywords: editKeywords.trim() || undefined,
          updated_at: new Date().toISOString(),
        }).eq("id", selectedDuplicate.id);
        if (error) throw error;
      }
      toast.success("KB entry updated successfully");
      setEditOpen(false);
      setDuplicateOpen(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save — please try again");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSubmitNew = async () => {
    if (!question.trim() || !answer.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from("curated_kb").insert({
        question: question.trim(),
        answer: answer.trim(),
        keywords: keywords.trim(),
        escalation_id: null,
        status: "DRAFT",
        created_by: session?.user?.email ?? session?.user?.name ?? "unknown",
        created_at: new Date().toISOString(),
        message_pair_ids: JSON.stringify(selectedMessages.map(m => m.id)),
      });
      if (insertError) throw insertError;
      toast.success("KB entry created as DRAFT");
      setCreateOpen(false);
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
      {/* Trigger button */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        disabled={!hasSelection || checking}
        onClick={handleOpen}
      >
        {checking ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <BookPlus className="h-3.5 w-3.5" />
        )}
        Create KB Item
        {hasSelection && !checking && (
          <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 py-0 leading-4">
            {selectedMessages.length}
          </span>
        )}
      </Button>

      {/* Duplicate warning dialog */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Question already in Knowledge Base
            </DialogTitle>
            <DialogDescription>
              This question matches {duplicates.length === 1 ? "an existing entry" : `${duplicates.length} existing entries`} in the knowledge base. Would you like to update the existing entry instead?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {duplicates.map((match) => (
              <div
                key={match.id}
                className={`rounded-md border p-3 cursor-pointer transition-colors ${
                  selectedDuplicate?.id === match.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
                onClick={() => setSelectedDuplicate(match)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {match.source === "knowledge_base" ? "Knowledge Base" : "Curated KB"}
                  </Badge>
                </div>
                <p className="text-sm font-medium line-clamp-2">{match.question}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{match.answer}</p>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setDuplicateOpen(false); setCreateOpen(true); }}>
              Create Anyway
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDuplicateOpen(false)}>
              Close
            </Button>
            <Button size="sm" onClick={() => selectedDuplicate && handleOpenEdit(selectedDuplicate)}>
              Make Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit drawer — slides in on top, warning dialog stays underneath */}
      <Sheet open={editOpen} onOpenChange={(open) => { if (!open) setEditOpen(false); }}>
        <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Edit KB Entry
              <Badge variant="secondary" className="text-[10px]">
                {selectedDuplicate?.source === "knowledge_base" ? "Knowledge Base" : "Curated KB"}
              </Badge>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            {selectedDuplicate?.source === "knowledge_base" && (
              <div>
                <Label className="text-xs mb-1 block">Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Keep existing category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">Leave blank to keep the existing category</p>
              </div>
            )}

            <div>
              <Label className="text-xs mb-1 block">Question *</Label>
              <Textarea
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                rows={2}
                maxLength={500}
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">Answer *</Label>
              <Textarea
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                rows={6}
                maxLength={2000}
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">Additional Keywords</Label>
              <Input
                value={editKeywords}
                onChange={(e) => setEditKeywords(e.target.value)}
                placeholder="comma separated — leave blank to keep existing"
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
              ← Back
            </Button>
            <Button
              size="sm"
              disabled={!editQuestion.trim() || !editAnswer.trim() || editSubmitting}
              onClick={handleSaveEdit}
            >
              {editSubmitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create new entry dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create KB Entry from Chat Log</DialogTitle>
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
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={!canSubmit || submitting} onClick={handleSubmitNew}>
              {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
