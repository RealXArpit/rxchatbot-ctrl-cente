import { StatusPill } from "@/components/platform/StatusPill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CredentialSlot } from "@/lib/mock-integrations";

interface Props {
  slots: CredentialSlot[];
}

export function CredentialSlotTable({ slots }: Props) {
  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs">Name</TableHead>
            <TableHead className="text-xs">Env Variable</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slots.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="text-xs font-medium py-2">{s.name}</TableCell>
              <TableCell className="py-2"><code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{s.envVarName}</code></TableCell>
              <TableCell className="text-xs text-muted-foreground py-2">{s.type.replace("_", " ")}</TableCell>
              <TableCell className="py-2">
                <StatusPill label={s.status} variant={s.status === "configured" ? "success" : s.status === "missing" ? "danger" : "muted"} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
