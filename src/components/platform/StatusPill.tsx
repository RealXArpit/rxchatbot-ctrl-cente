import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger" | "muted" | "primary";

const variantClasses: Record<Variant, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
  primary: "bg-primary/15 text-primary",
};

export function StatusPill({ label, variant = "muted" }: { label: string; variant?: Variant }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide", variantClasses[variant])}>
      {label}
    </span>
  );
}
