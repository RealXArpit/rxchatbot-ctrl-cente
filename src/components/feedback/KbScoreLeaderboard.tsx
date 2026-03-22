import { getKbFeedbackScores } from "@/lib/mock-feedback";
import { useKbScores } from "@/hooks/useFeedback";
import type { KbFeedbackScore } from "@/lib/mock-feedback";
import { useNavigate, useParams } from "react-router-dom";

export function KbScoreLeaderboard() {
  const { data: liveScores } = useKbScores();
  const navigate = useNavigate();
  const { env } = useParams<{ env: string }>();
  const scores = liveScores && liveScores.length > 0 ? liveScores : getKbFeedbackScores();
  const sorted = [...scores].sort((a, b) => b.feedbackScore - a.feedbackScore);
  const top5    = sorted.slice(0, 5);
  const bottom5 = sorted.length >= 5 ? sorted.slice(-5).reverse() : [...sorted].reverse();

  const Row = ({ item }: { item: KbFeedbackScore }) => (
    <div
      className="flex items-center justify-between py-1.5 text-xs cursor-pointer hover:bg-muted/50 rounded-md px-1 -mx-1 transition-colors group"
      onClick={() => navigate(`/realx/${env}/train/kb/${item.kbId}`)}
      title="Click to edit this KB entry"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-foreground group-hover:text-primary transition-colors">{item.question}</p>
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
          {top5.length === 0
            ? <p className="text-xs text-muted-foreground py-2">No feedback data yet.</p>
            : top5.map((s) => <Row key={s.kbId} item={s} />)}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-xs font-medium text-destructive uppercase tracking-wide mb-3">Needs Attention (Lowest 5)</h4>
        <div className="divide-y divide-border">
          {bottom5.length === 0
            ? <p className="text-xs text-muted-foreground py-2">No feedback data yet.</p>
            : bottom5.map((s) => <Row key={s.kbId} item={s} />)}
        </div>
      </div>
    </div>
  );
}
