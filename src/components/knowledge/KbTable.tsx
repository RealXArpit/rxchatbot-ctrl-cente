import { useNavigate, useParams } from "react-router-dom";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeBaseItem } from "@/lib/mock-kb";

const statusColor: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Proposed: "bg-warning/10 text-warning border-warning/30",
  Approved: "bg-primary/10 text-primary border-primary/30",
  Published: "bg-success/10 text-success border-success/30",
  Archived: "bg-muted text-muted-foreground",
};

interface Props {
  items: KnowledgeBaseItem[];
  isAuditor?: boolean;
}

export function KbTable({ items, isAuditor }: Props) {
  const navigate = useNavigate();
  const { env } = useParams<{ env: string }>();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No knowledge base items found.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">ID</TableHead>
          <TableHead className="w-24">Category</TableHead>
          <TableHead>Question</TableHead>
          {!isAuditor && <TableHead className="hidden lg:table-cell">Answer</TableHead>}
          <TableHead className="w-24">Status</TableHead>
          <TableHead className="w-32">Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer"
            onClick={() => navigate(`/realx/${env}/train/kb/${item.id}`)}
          >
            <TableCell className="font-mono text-xs">{item.id}</TableCell>
            <TableCell className="text-xs">{item.category}</TableCell>
            <TableCell className="text-xs max-w-xs truncate">{item.question}</TableCell>
            {!isAuditor && <TableCell className="text-xs max-w-xs truncate hidden lg:table-cell text-muted-foreground">{item.answer}</TableCell>}
            <TableCell>
              <Badge variant="outline" className={statusColor[item.status]}>{item.status}</Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground tabular-nums">{item.lastUpdated}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
