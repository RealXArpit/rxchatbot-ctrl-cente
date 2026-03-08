import { useMemo } from "react";
import { getKbFeedbackScores } from "@/lib/mock-feedback";

export function KbScoreLeaderboard() {
  const scores = useMemo(() => getKbFeedbackScores(), []);
  const sorted = [...scores].sort((a, b) => b.feedbackScore - a.feedbackScore);
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  const Row = ({ item }: { item: typeof scores[0] }) => (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <div className="min-w-0 flex-1">
        <p className="truncate text-foreground">{item.question}</p>
        <p className="text-[10px] text-muted-foreground">{item.category} · {item.useCount} uses</p>
      </div>
      <span className="tabular-nums font-medium ml-3 shrink-0">
        {(item.feedbackScore * 100).toFixed(0)}%
      </span>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Top 5 Rated</h4>
        <div className="divide-y divide-border">
          {top5.map((s) => <Row key={s.kbId} item={s} />)}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-xs font-medium text-destructive uppercase tracking-wide mb-3">Needs Attention (Lowest 5)</h4>
        <div className="divide-y divide-border">
          {bottom5.map((s) => <Row key={s.kbId} item={s} />)}
        </div>
      </div>
    </div>
  );
}
