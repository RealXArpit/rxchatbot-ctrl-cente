import { format } from "date-fns";

export function Timestamp({ date, fmt = "d MMM yyyy" }: { date: string | Date; fmt?: string }) {
  const d = typeof date === "string" ? new Date(date) : date;
  return <span className="tabular-nums text-sm text-muted-foreground">{format(d, fmt)}</span>;
}
