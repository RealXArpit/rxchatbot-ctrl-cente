import { useState, useEffect, useMemo } from "react";
import { BookPlus, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Props {
  ticketId: string;
  sessionId?: string;
  escalationId?: string;
  status: string;
}

interface TranscriptTurn {
  id: string;
  role: "User" | "Agent" | "Bot";
  text: string;
  timestamp: string;
}

const CATEGORIES = [
  "Curated",
  "Platform & General",
  "Legal & Regulatory",
  "Pricing",
  "Other",
] as const;

const ALLOWED_ROLES = ["SupportAgent", "OpsManager", "KnowledgeManager", "SuperAdmin"];

export function CreateKbFromTicketButton({ ticketId, sessionId, escalationId, status }: Props) {
  const { session } = useAuth();
  const role = session?.user.role;

  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  const [selectedUserMsgId, setSelectedUserMsgId] = useState("");
  const [selectedAgentMsgId, setSelectedAgentMsgId] = useState("");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userTurns = useMemo(() => transcript.filter(t => t.role === "User"), [transcript]);
  const agentTurns = useMemo(() => transcript.filter(t => t.role === "Agent"), [transcript]);

  // Pre-fill question/answer when selections change
  useEffect(() => {
    const sel = transcript.find(t => t.id === selectedUserMsgId);
    if (sel) setQuestion(sel.text);
  }, [selectedUserMsgId, transcript]);

  useEffect(() => {
    const sel = transcript.find(t => t.id === selectedAgentMsgId);
    if (sel) setAnswer(sel.text);
  }, [selectedAgentMsgId, transcript]);

  const fetchTranscript = async () => {
    if (!sessionId) return;
    setLoadingTranscript(true);
    try {
      const [interventionsRes, sessionsRes] = await Promise.all([
        supabase
          .from("agent_interventions")
          .select("id, session_id, message, timestamp")
          .eq("session_id", sessionId)
          .order("timestamp", { ascending: true }),
        supabase
          .from("sessions")
          .select("id, session_id, role, message, message_type, timestamp")
          .eq("session_id", sessionId)
          .eq("message_type", "chat")
          .order("timestamp", { ascending: true }),
      ]);

      const turns: TranscriptTurn[] = [];

      // Map session rows
      for (const row of sessionsRes.data ?? []) {
        if (!row.message?.trim()) continue;
        const role: TranscriptTurn["role"] =
          row.role === "user" ? "User" :
          row.role === "assistant" ? "Bot" : "Agent";
        turns.push({ id: row.id, role, text: row.message, timestamp: row.timestamp ?? "" });
      }

      // Map agent intervention rows
      for (const row of interventionsRes.data ?? []) {
        if (!row.message?.trim()) continue;
        turns.push({ id: row.id, role: "Agent", text: row.message, timestamp: row.timestamp ?? "" });
      }

      // Sort by timestamp
      turns.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      setTranscript(turns);
    } catch {
      toast.error("Failed to load transcript");
    } finally {
      setLoadingTranscript(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setSelectedUserMsgId("");
    setSelectedAgentMsgId("");
    setQuestion("");
    setAnswer("");
    setCategory("");
    setKeywords("");
    fetchTranscript();
  };

  const canSubmit = selectedUserMsgId && selectedAgentMsgId && question.trim() && answer.trim() && category;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("curated_kb").insert({
        question: question.trim(),
        answer: answer.trim(),
        category,
        keywords: keywords.trim(),
        status: "DRAFT",
        created_by: session?.user.id ?? "",
        escalation_id: escalationId ?? ticketId,
        session_id: sessionId ?? "",
        message_pair_ids: [selectedUserMsgId, selectedAgentMsgId],
      });
      if (error) throw error;
      toast.success("Saved to Curated KB — awaiting review");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save KB item");
    } finally {
      setSubmitting(false);
    }
  };

  const roleBadgeColor: Record<string, string> = {
    User: "bg-primary/10 text-primary",
    Agent: "bg-warning/10 text-warning-foreground",
    Bot: "bg-muted text-muted-foreground",
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleOpen}>
        <BookPlus className="h-3.5 w-3.5" />
        Create KB Item
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Knowledge Base Item from Ticket</DialogTitle>
          </DialogHeader>

          {/* PII Warning */}
          <Alert className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground text-xs">
              Remove any personally identifiable information before saving.
            </AlertDescription>
          </Alert>

          <ScrollArea className="flex-1 pr-2 space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4 pb-2">
              {/* Transcript */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Conversation Transcript
                </Label>
                {loadingTranscript ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading transcript…
                  </div>
                ) : transcript.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No transcript found for this session.</p>
                ) : (
                  <div className="border rounded-md p-2 space-y-1.5 max-h-48 overflow-y-auto bg-muted/30">
                    {transcript.map(t => (
                      <div key={t.id} className="flex gap-2 text-xs">
                        <Badge variant="secondary" className={`${roleBadgeColor[t.role]} text-[10px] px-1.5 py-0 h-4 shrink-0`}>
                          {t.role}
                        </Badge>
                        <span className="text-foreground break-words">{t.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Select user question */}
              <div>
                <Label className="text-xs mb-1 block">Select user question *</Label>
                <Select value={selectedUserMsgId} onValueChange={setSelectedUserMsgId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Choose a user message…" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTurns.map(t => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.text.length > 120 ? t.text.slice(0, 120) + "…" : t.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select agent answer */}
              <div>
                <Label className="text-xs mb-1 block">Select agent answer *</Label>
                <Select value={selectedAgentMsgId} onValueChange={setSelectedAgentMsgId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Choose an agent message…" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentTurns.map(t => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.text.length > 120 ? t.text.slice(0, 120) + "…" : t.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Editable fields */}
              <div>
                <Label className="text-xs mb-1 block">Question *</Label>
                <Textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="text-xs"
                  placeholder="User question for the KB entry"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{question.length}/500</p>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Answer *</Label>
                <Textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="text-xs"
                  placeholder="Agent answer for the KB entry"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{answer.length}/2000</p>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Keywords</Label>
                <Input
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="comma-separated keywords"
                  className="text-xs"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={!canSubmit || submitting} onClick={handleSubmit}>
              {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Submit to KB
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
