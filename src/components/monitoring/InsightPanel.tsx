import { useState } from "react";
import { Brain, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/TenantContext";
import { getMetricsSnapshot } from "@/lib/mock-metrics";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function InsightPanel() {
  const { env } = useTenant();
  const snap = getMetricsSnapshot(env);
  const k = snap.kpis;

  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snapshotUsed, setSnapshotUsed] = useState<{ generatedAt: string; kpis: typeof k } | null>(null);

  const generate = async () => {
    setLoading(true);
    setInsights(null);
    try {
      const kpis = {
        containmentRate: Math.round(k.containmentRate * 100),
        escalationRate: Math.round(k.escalationRate * 100),
        cacheHitRate: Math.round(k.cacheHitRate * 100),
        p0SlaFirstResponse: Math.round(k.p0SlaFirstResponse * 100),
        p1SlaFirstResponse: Math.round(k.p1SlaFirstResponse * 100),
        p2SlaFirstResponse: Math.round(k.p2SlaFirstResponse * 100),
      };

      const { data, error } = await supabase.functions.invoke("kpi-insights", {
        body: { kpis },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setInsights(data.insights);
      setSnapshotUsed({ generatedAt: new Date().toISOString(), kpis: k });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  // Parse bullet points from the AI response
  const bullets = insights
    ? insights
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("- ") || l.startsWith("• ") || l.startsWith("* ") || /^\d+[\.\)]/.test(l))
        .map((l) => l.replace(/^[-•*]\s*/, "").replace(/^\d+[\.\)]\s*/, ""))
    : [];

  // If parsing didn't find bullets, show raw text
  const showRaw = insights && bullets.length === 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Reya's Read on the Numbers</h2>
        </div>

        {insights && !loading && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5 text-muted-foreground"
            onClick={generate}
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
        )}
      </div>

      {/* Generate button (initial state) */}
      {!insights && !loading && (
        <div className="flex flex-col items-center py-6 gap-3">
          <p className="text-xs text-muted-foreground text-center max-w-md">
            Get an AI-powered interpretation of the current KPI snapshot — plain English observations and a recommendation.
          </p>
          <Button size="sm" className="gap-1.5" onClick={generate}>
            <Sparkles className="h-3.5 w-3.5" />
            Generate Insights
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 py-2">
          <Skeleton className="h-4 w-full animate-pulse" />
          <Skeleton className="h-4 w-[90%] animate-pulse" />
          <Skeleton className="h-4 w-[95%] animate-pulse" />
          <Skeleton className="h-4 w-[80%] animate-pulse" />
        </div>
      )}

      {/* Bullet points */}
      {!loading && bullets.length > 0 && (
        <ul className="space-y-2.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground leading-relaxed">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Raw fallback */}
      {!loading && showRaw && (
        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{insights}</p>
      )}

      {/* Snapshot reference */}
      {!loading && snapshotUsed && (
        <div className="rounded-md bg-muted/50 border border-border px-3 py-2 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Data snapshot used · {new Date(snapshotUsed.generatedAt).toLocaleString()}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground font-mono tabular-nums">
            <span>Containment {Math.round(snapshotUsed.kpis.containmentRate * 100)}%</span>
            <span>Escalation {Math.round(snapshotUsed.kpis.escalationRate * 100)}%</span>
            <span>Cache {Math.round(snapshotUsed.kpis.cacheHitRate * 100)}%</span>
            <span>P0 {Math.round(snapshotUsed.kpis.p0SlaFirstResponse * 100)}%</span>
            <span>P1 {Math.round(snapshotUsed.kpis.p1SlaFirstResponse * 100)}%</span>
            <span>P2 {Math.round(snapshotUsed.kpis.p2SlaFirstResponse * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
