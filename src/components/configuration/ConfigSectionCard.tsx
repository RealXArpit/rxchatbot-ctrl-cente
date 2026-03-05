import { cn } from "@/lib/utils";

interface ConfigSectionCardProps {
  title: string;
  description?: string;
  readOnly?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ConfigSectionCard({ title, description, readOnly, children, className }: ConfigSectionCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {readOnly && (
          <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Read-only
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
