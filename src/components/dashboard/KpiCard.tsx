import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KpiCardProps {
  label: string;
  value: string;
  change?: number; // percent change, positive = good
  invertChange?: boolean; // true = lower is better (e.g., escalation rate)
  tooltip?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantBorder: Record<string, string> = {
  default: "border-border",
  success: "border-success/30",
  warning: "border-warning/30",
  danger: "border-destructive/30",
};

export function KpiCard({ label, value, change, invertChange, tooltip, variant = "default" }: KpiCardProps) {
  const isPositive = change !== undefined && (invertChange ? change < 0 : change > 0);
  const isNegative = change !== undefined && (invertChange ? change > 0 : change < 0);

  return (
    <div className={cn("rounded-lg border bg-card p-4 flex flex-col gap-1", variantBorder[variant])}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{label}</span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground/60 shrink-0 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
      {change !== undefined && (
        <div className="flex items-center gap-1 text-xs">
          {isPositive && <ArrowUp className="h-3 w-3 text-success" />}
          {isNegative && <ArrowDown className="h-3 w-3 text-destructive" />}
          <span className={cn("tabular-nums", isPositive && "text-success", isNegative && "text-destructive", !isPositive && !isNegative && "text-muted-foreground")}>
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">vs prev period</span>
        </div>
      )}
    </div>
  );
}
