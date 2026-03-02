import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStatePanelProps {
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  icon?: React.ReactNode;
}

export function EmptyStatePanel({
  title = "Not configured yet",
  description = "This module hasn't been set up. Get started by configuring it below.",
  ctaLabel = "Get started",
  onCta,
  icon,
}: EmptyStatePanelProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
        {icon ?? <PackageOpen className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      <Button className="mt-5" variant="default" size="sm" onClick={onCta}>
        {ctaLabel}
      </Button>
    </div>
  );
}
