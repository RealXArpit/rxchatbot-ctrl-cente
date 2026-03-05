import type { FullConfig } from "@/lib/mock-config";

interface DiffViewerProps {
  before: FullConfig | null;
  after: FullConfig;
}

export function DiffViewer({ before, after }: DiffViewerProps) {
  const beforeStr = before ? JSON.stringify(before, null, 2) : "(none)";
  const afterStr = JSON.stringify(after, null, 2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Before</p>
        <pre className="text-xs font-mono bg-muted/50 border border-border rounded-md p-3 overflow-auto max-h-[400px] text-muted-foreground whitespace-pre-wrap">
          {beforeStr}
        </pre>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">After</p>
        <pre className="text-xs font-mono bg-muted/50 border border-border rounded-md p-3 overflow-auto max-h-[400px] text-foreground whitespace-pre-wrap">
          {afterStr}
        </pre>
      </div>
    </div>
  );
}
