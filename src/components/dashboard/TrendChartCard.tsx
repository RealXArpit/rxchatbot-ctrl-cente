import { WidgetFrame } from "./WidgetFrame";
import type { TrendPoint } from "@/lib/mock-metrics";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

interface TrendChartCardProps {
  data: TrendPoint[];
  loading?: boolean;
}

export function TrendChartCard({ data, loading }: TrendChartCardProps) {
  return (
    <WidgetFrame
      title="Conversation Trends"
      subtitle="7-day volume & containment"
      loading={loading}
      empty={data.length === 0}
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v: string) => format(parseISO(v), "d MMM")}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => {
                if (name === "conversations") return [value, "Conversations"];
                return [`${Math.round(value * 100)}%`, name === "containment" ? "Containment" : "Escalation"];
              }}
              labelFormatter={(v: string) => format(parseISO(v), "d MMM yyyy")}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(val: string) =>
                val === "conversations" ? "Conversations" : val === "containment" ? "Containment %" : "Escalation %"
              }
            />
            <Line yAxisId="left" type="monotone" dataKey="conversations" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="containment" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="escalation" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </WidgetFrame>
  );
}
