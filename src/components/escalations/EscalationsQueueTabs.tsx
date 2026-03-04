import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  value: "unassigned" | "mine" | "all";
  onChange: (v: "unassigned" | "mine" | "all") => void;
  counts: { unassigned: number; mine: number; all: number };
}

export function EscalationsQueueTabs({ value, onChange, counts }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Props["value"])}>
      <TabsList>
        <TabsTrigger value="unassigned">Unassigned ({counts.unassigned})</TabsTrigger>
        <TabsTrigger value="mine">Assigned to me ({counts.mine})</TabsTrigger>
        <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
