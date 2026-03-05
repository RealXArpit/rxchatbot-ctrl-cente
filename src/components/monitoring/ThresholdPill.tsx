import { cn } from "@/lib/utils";

interface ThresholdPillProps {
  operator: string;
  threshold: number;
  className?: string;
}

export function ThresholdPill({ operator, threshold, className }: ThresholdPillProps) {
  const display = threshold < 1 ? `${(threshold * 100).toFixed(0)}%` : String(threshold);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-mono tabular-nums text-muted-foreground",
        className
      )}
    >
      {operator} {display}
    </span>
  );
}
