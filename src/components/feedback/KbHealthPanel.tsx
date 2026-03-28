import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Activity, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useKbHealth } from '@/hooks/useKbHealth';
import { LoadingSkeleton } from '@/components/platform/LoadingSkeleton';
import { ErrorPanel } from '@/components/platform/ErrorPanel';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

function ScoreBar({ score, maxScore = 12 }: { score: number; maxScore?: number }) {
  const pct = Math.max(0, Math.min(100, (score / maxScore) * 100));
  const color = score < 0 ? 'bg-destructive'
    : score < 2 ? 'bg-warning'
    : score < 5 ? 'bg-yellow-400'
    : score < 8 ? 'bg-success/70'
    : 'bg-success';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground">
        {score.toFixed(2)}
      </span>
    </div>
  );
}

export function KbHealthPanel() {
  const navigate = useNavigate();
  const { env } = useParams<{ env: string }>();
  const { data, isLoading, error, refetch } = useKbHealth();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorPanel onRetry={() => refetch()} />;
  if (!data) return null;

  const { distribution, needsReview, untested, topPerformers, signals } = data;
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">

      {/* ── Section 1: Score Distribution ─────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          KB Score Distribution
        </h3>
        <p className="text-xs text-muted-foreground">
          How {total} active KB entries are performing based on user
          feedback. Scores are weighted averages of thumbs up (+) and
          thumbs down (−) signals.
        </p>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Negative', count: distribution.negative, color: 'text-destructive', bg: 'bg-destructive/10 border border-destructive/30' },
            { label: 'Low', count: distribution.low, color: 'text-warning', bg: 'bg-warning/10 border border-warning/30' },
            { label: 'Neutral', count: distribution.neutral, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border border-yellow-500/30' },
            { label: 'Good', count: distribution.good, color: 'text-success/80', bg: 'bg-success/10 border border-success/30' },
            { label: 'Strong', count: distribution.strong, color: 'text-success', bg: 'bg-success/15 border border-success/40' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`rounded-lg p-3 text-center ${bg}`}>
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground/70">
                {total > 0 ? Math.round((count / total) * 100) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Needs Review Queue ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Needs Review</h3>
          {needsReview.length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {needsReview.length}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Entries flagged because they are used often with low scores,
          have received thumbs-down at high confidence, or have gone negative.
          These are the entries most likely to be giving users wrong answers.
        </p>
        {needsReview.length === 0 ? (
          <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-success" />
            No entries need review right now.
          </div>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>👎</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {needsReview.map((entry) => {
                  const flags: string[] = [];
                  if (entry.feedback_score < 0) flags.push('Negative score');
                  if (entry.use_count >= 3 && entry.feedback_score < 2) flags.push('High use, low score');
                  if (entry.high_confidence_negatives >= 1) flags.push('Confident wrong answer');
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="max-w-[200px] truncate text-xs">
                        {entry.question}
                      </TableCell>
                      <TableCell className="text-xs">{entry.category}</TableCell>
                      <TableCell>
                        <ScoreBar score={entry.feedback_score} />
                      </TableCell>
                      <TableCell className="text-xs">{entry.use_count}</TableCell>
                      <TableCell className="text-xs text-destructive">
                        {entry.negative_feedback_count > 0 ? entry.negative_feedback_count : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {flags.map(f => (
                            <Badge key={f} variant="outline" className="text-[10px] border-warning/50 text-warning">
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm" variant="outline"
                          className="h-6 text-[10px]"
                          onClick={() => navigate(`/realx/${env}/train/kb/${entry.id}`)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Section 3: Recent Feedback Signals ────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Recent Feedback Signals</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          What the agent is learning right now. Each row is a user
          feedback event — what they asked, which KB entry was used,
          how confident the bot was, and whether the user approved.
        </p>
        {signals.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No feedback signals yet.
          </div>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User asked</TableHead>
                  <TableHead>KB entry used</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signals.map((s, i) => (
                  <TableRow key={`${s.log_id}-${s.kb_id}-${i}`}>
                    <TableCell className="max-w-[180px] truncate text-xs">
                      {s.user_message}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs">
                      <button
                        className="text-primary hover:underline text-left"
                        onClick={() => navigate(`/realx/${env}/train/kb/${s.kb_id}`)}
                      >
                        {s.kb_question}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {(s.confidence * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-xs">
                      {s.feedback === 1 ? (
                        <Badge variant="outline" className="border-success/50 text-success text-[10px]">👍 Helpful</Badge>
                      ) : s.feedback === -1 ? (
                        <Badge variant="outline" className="border-destructive/50 text-destructive text-[10px]">👎 Not helpful</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Section 4: Top Performers ─────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <h3 className="text-sm font-semibold text-foreground">Top Performing Entries</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Entries with the highest feedback scores from real usage
          (use_count ≥ 2). These are working well — use them as
          quality benchmarks when writing new entries.
        </p>
        {topPerformers.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Not enough usage data yet.
          </div>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Uses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/realx/${env}/train/kb/${entry.id}`)}
                  >
                    <TableCell className="max-w-[220px] truncate text-xs">
                      {entry.question}
                    </TableCell>
                    <TableCell className="text-xs">{entry.category}</TableCell>
                    <TableCell>
                      <ScoreBar score={entry.feedback_score} />
                    </TableCell>
                    <TableCell className="text-xs">{entry.use_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

    </div>
  );
}
