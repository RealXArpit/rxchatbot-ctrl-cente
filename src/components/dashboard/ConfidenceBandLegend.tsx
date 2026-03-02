import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { ConfidenceBands } from "@/lib/mock-metrics";

const bandDefs = [
  { key: "high" as const, label: "High ≥ 0.72", colorClass: "bg-success" },
  { key: "medium" as const, label: "Medium 0.55–0.72", colorClass: "bg-warning" },
  { key: "low" as const, label: "Low < 0.55", colorClass: "bg-destructive" },
];

interface ConfidenceBandLegendProps {
  bands: ConfidenceBands;
  className?: string;
}

export function ConfidenceBandLegend({ bands, className }: ConfidenceBandLegendProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm font-medium text-foreground">Confidence Bands</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px] text-xs">
            Distribution of bot response confidence scores across all conversations.
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-3">
        {bandDefs.map((b) => (
          <div
            key={b.key}
            className={cn(b.colorClass, "transition-all")}
            style={{ width: `${bands[b.key] * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {bandDefs.map((b) => (
          <div key={b.key} className="flex items-center gap-1.5 text-xs">
            <span className={cn("h-2 w-2 rounded-full", b.colorClass)} />
            <span className="text-muted-foreground">{b.label}</span>
            <span className="font-medium tabular-nums text-foreground">{Math.round(bands[b.key] * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
