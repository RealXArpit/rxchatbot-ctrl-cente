import { Badge } from "@/components/ui/badge";
import type { KbVersion } from "@/lib/mock-kb";

const statusColor: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Proposed: "bg-warning/10 text-warning border-warning/30",
  Approved: "bg-primary/10 text-primary border-primary/30",
  Published: "bg-success/10 text-success border-success/30",
  Archived: "bg-muted text-muted-foreground",
};

export function VersionTimeline({ versions }: { versions: KbVersion[] }) {
  const sorted = [...versions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Version History</h4>
      {sorted.length === 0 && <p className="text-xs text-muted-foreground">No history.</p>}
      <div className="relative pl-4 border-l-2 border-border space-y-3">
        {sorted.map((v) => (
          <div key={v.id} className="relative">
            <div className="absolute -left-[1.15rem] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${statusColor[v.status]}`}>{v.status}</Badge>
                <span className="text-muted-foreground tabular-nums">{new Date(v.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-foreground/80">{v.reason} — <span className="font-medium">{v.actorName}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
