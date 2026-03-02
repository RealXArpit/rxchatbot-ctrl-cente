import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WidgetFrameProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function WidgetFrame({
  title,
  subtitle,
  actions,
  loading,
  error,
  empty,
  emptyMessage = "No data available",
  onRetry,
  children,
  className = "",
}: WidgetFrameProps) {
  return (
    <div className={`rounded-lg border border-border bg-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-1 shrink-0 ml-2">{actions}</div>}
      </div>

      {/* Body */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load data</p>
            {onRetry && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={onRetry}>
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            )}
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
