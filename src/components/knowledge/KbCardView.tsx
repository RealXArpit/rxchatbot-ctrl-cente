import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Pencil, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateKbItem } from "@/hooks/useKbItems";
import { getKbCategories } from "@/lib/mock-kb";
import type { KnowledgeBaseItem } from "@/lib/mock-kb";
import type { Role } from "@/lib/mock-api";

const CAN_EDIT: Role[] = ["KnowledgeManager", "OpsManager", "SuperAdmin"];

const statusColor: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Proposed: "bg-warning/10 text-warning border-warning/30",
  Approved: "bg-primary/10 text-primary border-primary/30",
  Published: "bg-success/10 text-success border-success/30",
  Archived: "bg-muted text-muted-foreground",
};

interface EditState {
  category: string;
  question: string;
  answer: string;
  keywords: string;
}

interface Props {
  items: KnowledgeBaseItem[];
  onClearFilters: () => void;
}

export function KbCardView({ items, onClearFilters }: Props) {
  const { env } = useParams<{ env: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const role = session?.user.role as Role;
  const canEdit = CAN_EDIT.includes(role);

  const updateMutation = useUpdateKbItem();
  const categories = getKbCategories();

  const [index, setIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<EditState | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [keywordModal, setKeywordModal] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EditState, string>>>({});
  const [pendingNav, setPendingNav] = useState<number | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const currentTranslate = useRef(0);
  const [pulsing, setPulsing] = useState(false);

  // Reset index to 0 when filtered items change
  useEffect(() => {
    setIndex(0);
    setIsEditing(false);
    setExpanded(false);
  }, [items]);

  const item = items[index] ?? null;

  const doNavigate = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= items.length) {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 200);
      return;
    }
    const card = cardRef.current;
    const direction = newIndex > index ? "left" : "right";
    const outX = direction === "left" ? "-110%" : "110%";
    const inX = direction === "left" ? "110%" : "-110%";

    if (card) {
      card.style.transition = "transform 200ms ease-in";
      card.style.transform = `translateX(${outX})`;
      setTimeout(() => {
        setIndex(newIndex);
        setIsEditing(false);
        setExpanded(false);
        setErrors({});
        card.style.transition = "none";
        card.style.transform = `translateX(${inX})`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            card.style.transition = "transform 200ms ease-out";
            card.style.transform = "translateX(0)";
          });
        });
      }, 200);
    } else {
      setIndex(newIndex);
      setIsEditing(false);
      setExpanded(false);
      setErrors({});
    }
  }, [items.length, index]);

  const tryNavigate = useCallback((newIndex: number) => {
    if (isEditing) {
      setPendingNav(newIndex);
      setShowUnsavedPrompt(true);
      return;
    }
    doNavigate(newIndex);
  }, [isEditing, doNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditing) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") tryNavigate(index + 1);
      if (e.key === "ArrowLeft") tryNavigate(index - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, isEditing, tryNavigate]);

  // Touch/pointer swipe
  const onPointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    dragStartX.current = e.clientX;
    currentTranslate.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null || isEditing) return;
    const delta = e.clientX - dragStartX.current;
    currentTranslate.current = delta;
    if (cardRef.current) {
      cardRef.current.style.transition = "none";
      cardRef.current.style.transform = `translateX(${delta}px)`;
    }
  };

  const onPointerUp = () => {
    if (dragStartX.current === null) return;
    const delta = currentTranslate.current;
    dragStartX.current = null;
    if (Math.abs(delta) > 60) {
      tryNavigate(delta < 0 ? index + 1 : index - 1);
    } else {
      if (cardRef.current) {
        cardRef.current.style.transition = "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)";
        cardRef.current.style.transform = "translateX(0)";
      }
    }
  };

  const enterEdit = () => {
    if (!item) return;
    const snap: EditState = {
      category: item.category,
      question: item.question,
      answer: item.answer,
      keywords: item.keywords.join(", "),
    };
    setEditSnapshot(snap);
    setEditState({ ...snap });
    setIsEditing(true);
    setErrors({});
  };

  const discardEdit = () => {
    setIsEditing(false);
    setEditState(null);
    setEditSnapshot(null);
    setErrors({});
    setShowUnsavedPrompt(false);
    if (pendingNav !== null) {
      const nav = pendingNav;
      setPendingNav(null);
      doNavigate(nav);
    }
  };

  const handleSave = () => {
    if (!editState || !item) return;
    const e: Partial<Record<keyof EditState, string>> = {};
    if (!editState.category) e.category = "Required";
    if (!editState.question.trim()) e.question = "Required";
    if (!editState.answer.trim()) e.answer = "Required";
    if (!editState.keywords.trim()) e.keywords = "At least one keyword";
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    updateMutation.mutate(
      { id: item.id, category: editState.category, question: editState.question, answer: editState.answer, keywords: editState.keywords },
      {
        onSuccess: () => {
          toast.success("KB entry saved");
          setIsEditing(false);
          setEditState(null);
          setEditSnapshot(null);
          setErrors({});
        },
        onError: () => {
          toast.error("Failed to save — please try again");
        },
      }
    );
  };

  const handleViewDetails = () => {
    if (isEditing) {
      setPendingNav(-1);
      setShowUnsavedPrompt(true);
      return;
    }
    navigate(`/realx/${env}/train/kb/${item?.id}`);
  };

  const confirmDiscardAndNavigate = () => {
    if (pendingNav === -1) {
      setIsEditing(false);
      setEditState(null);
      setEditSnapshot(null);
      setErrors({});
      setShowUnsavedPrompt(false);
      setPendingNav(null);
      navigate(`/realx/${env}/train/kb/${item?.id}`);
    } else {
      discardEdit();
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No KB items match your filters.</p>
        <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={onClearFilters}>Clear filters</Button>
      </div>
    );
  }

  if (!item) return null;

  const displayKeywords = (isEditing ? editState?.keywords.split(",").map(k => k.trim()).filter(Boolean) : item.keywords) ?? [];
  const shownKeywords = displayKeywords.slice(0, 3);
  const extraCount = displayKeywords.length - 3;

  const answerText = isEditing ? editState!.answer : item.answer;
  const ANSWER_PREVIEW_LENGTH = 220;
  const isLong = answerText.length > ANSWER_PREVIEW_LENGTH;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Card */}
      <div
        className="w-full max-w-2xl touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          ref={cardRef}
          className={`rounded-lg border bg-card p-5 space-y-4 transition-[border-color] duration-150 ${isEditing ? "border-primary" : "border-border"} ${pulsing ? "animate-pulse-scale" : ""}`}
        >
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            {isEditing ? (
              <Select value={editState!.category} onValueChange={v => setEditState({ ...editState!, category: v })}>
                <SelectTrigger className="h-7 w-auto text-xs" onPointerDown={e => e.stopPropagation()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary" className="text-[11px]">{item.category}</Badge>
            )}
            <Badge className={`text-[11px] ${statusColor[item.status] ?? "bg-muted text-muted-foreground"}`}>{item.status}</Badge>
          </div>

          {/* Question */}
          {isEditing ? (
            <div>
              <Input
                value={editState!.question}
                onChange={e => setEditState({ ...editState!, question: e.target.value })}
                className="text-base font-semibold h-auto py-1"
                maxLength={500}
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              />
              {errors.question && <p className="text-xs text-destructive mt-1">{errors.question}</p>}
            </div>
          ) : (
            <h3 className="text-lg font-semibold leading-snug line-clamp-2">{item.question}</h3>
          )}

          {/* Answer */}
          {isEditing ? (
            <div>
              <Textarea
                value={editState!.answer}
                onChange={e => setEditState({ ...editState!, answer: e.target.value })}
                className="text-sm min-h-[100px]"
                maxLength={5000}
                onPointerDown={e => e.stopPropagation()}
              />
              {errors.answer && <p className="text-xs text-destructive mt-1">{errors.answer}</p>}
            </div>
          ) : (
            <div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {isLong && !expanded ? answerText.slice(0, ANSWER_PREVIEW_LENGTH) + "…" : answerText}
              </p>
              {isLong && (
                <button
                  className="text-xs text-primary mt-1 hover:underline"
                  onClick={e => { e.stopPropagation(); setExpanded(p => !p); }}
                >
                  {expanded ? "Show less ↑" : "Read more ↓"}
                </button>
              )}
            </div>
          )}

          <hr className="border-border" />

          {/* Keywords */}
          <div className="flex flex-wrap items-center gap-1.5">
            {isEditing ? (
              <div className="w-full">
                <Input
                  value={editState!.keywords}
                  onChange={e => setEditState({ ...editState!, keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                  className="h-7 text-xs"
                  onPointerDown={e => e.stopPropagation()}
                />
                {errors.keywords && <p className="text-xs text-destructive mt-1">{errors.keywords}</p>}
              </div>
            ) : (
              <>
                {shownKeywords.map(kw => (
                  <span key={kw} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{kw}</span>
                ))}
                {extraCount > 0 && (
                  <button
                    className="text-[11px] text-primary hover:underline"
                    onClick={e => { e.stopPropagation(); setKeywordModal(true); }}
                  >
                    +{extraCount} more
                  </button>
                )}
                {displayKeywords.length === 0 && (
                  <span className="text-[11px] text-muted-foreground italic">No keywords</span>
                )}
              </>
            )}
          </div>

          <hr className="border-border" />

          {/* Footer */}
          {showUnsavedPrompt ? (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-warning">You have unsaved changes.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setShowUnsavedPrompt(false); setPendingNav(null); }}>Cancel</Button>
                <Button size="sm" variant="destructive" className="text-xs h-7" onClick={confirmDiscardAndNavigate}>Discard & Continue</Button>
              </div>
            </div>
          ) : isEditing ? (
            <div className="flex items-center gap-2">
              <Button size="sm" className="text-xs h-7" onClick={handleSave} disabled={updateMutation.isPending} onPointerDown={e => e.stopPropagation()}>
                {updateMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Save
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={discardEdit} disabled={updateMutation.isPending} onPointerDown={e => e.stopPropagation()}>Discard</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-muted-foreground tabular-nums">Updated {item.lastUpdated}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={handleViewDetails}>
                  <ExternalLink className="h-3 w-3" /> View details
                </Button>
                {canEdit && (
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={enterEdit}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost" size="sm"
          disabled={index === 0}
          className={index === 0 ? "opacity-40" : ""}
          onClick={() => tryNavigate(index - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">{index + 1} / {items.length}</span>
        <Button
          variant="ghost" size="sm"
          disabled={index === items.length - 1}
          className={index === items.length - 1 ? "opacity-40" : ""}
          onClick={() => tryNavigate(index + 1)}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Keyword modal */}
      <Dialog open={keywordModal} onOpenChange={setKeywordModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">All keywords — {item.id}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
            {displayKeywords.map(kw => (
              <span key={kw} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{kw}</span>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
