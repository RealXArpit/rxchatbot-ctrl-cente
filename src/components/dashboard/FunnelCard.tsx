import { WidgetFrame } from "./WidgetFrame";
import type { FunnelStep } from "@/lib/mock-metrics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface FunnelCardProps {
  data: FunnelStep[];
  loading?: boolean;
}

export function FunnelCard({ data, loading }: FunnelCardProps) {
  return (
    <WidgetFrame
      title="Conversation Funnel"
      subtitle="Resolution breakdown"
      loading={loading}
      empty={data.length === 0}
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              width={130}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetFrame>
  );
}
