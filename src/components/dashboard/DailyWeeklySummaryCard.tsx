import { WidgetFrame } from "./WidgetFrame";

interface DailyWeeklySummaryCardProps {
  items: { label: string; value: string }[];
  loading?: boolean;
}

export function DailyWeeklySummaryCard({ items, loading }: DailyWeeklySummaryCardProps) {
  return (
    <WidgetFrame title="Daily Summary" loading={loading} empty={items.length === 0}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </WidgetFrame>
  );
}
