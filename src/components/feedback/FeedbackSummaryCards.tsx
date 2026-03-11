import { useFeedbackSummary } from "@/hooks/useFeedback";
import { getFeedbackSummary } from "@/lib/mock-feedback";
import { cn } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/platform/LoadingSkeleton";

export function FeedbackSummaryCards() {
  const { data: liveData, isLoading } = useFeedbackSummary();
  const s = liveData ?? getFeedbackSummary();
  const satPct = Math.round(s.satisfactionRate * 100);
  const satColor = satPct >= 80 ? "text-success" : satPct >= 60 ? "text-warning" : "text-destructive";

  const cards = [
    { label: "Total Feedback", value: s.totalFeedback, color: "text-foreground" },
    { label: "👍 Positive",    value: s.positiveCount,  color: "text-success" },
    { label: "👎 Negative",    value: s.negativeCount,  color: "text-destructive" },
    { label: "Satisfaction Rate", value: `${satPct}%`, color: satColor },
  ];

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
          <p className={cn("text-2xl font-semibold tabular-nums", c.color)}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
