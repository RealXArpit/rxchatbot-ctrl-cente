interface DashboardGridProps {
  children: React.ReactNode;
}

export function DashboardGrid({ children }: DashboardGridProps) {
  return <div className="space-y-6">{children}</div>;
}

export function DashboardRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {children}
    </div>
  );
}
