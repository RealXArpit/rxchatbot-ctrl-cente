import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorPanel({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
      <h3 className="text-base font-medium text-foreground">Something went wrong</h3>
      <p className="mt-1 text-sm text-muted-foreground">An unexpected error occurred. Please try again.</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
