import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Match {
  kbId: string;
  question: string;
  score: number;
}

interface Props {
  matches: Match[];
  threshold: number;
}

export function MatchScoringTable({ matches, threshold }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Top Matches</CardTitle></CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-xs text-muted-foreground">No matches found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-xs">ID</TableHead>
                <TableHead className="text-xs">Question</TableHead>
                <TableHead className="w-24 text-xs">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m) => (
                <TableRow key={m.kbId}>
                  <TableCell className="font-mono text-xs">{m.kbId}</TableCell>
                  <TableCell className="text-xs max-w-xs truncate">{m.question}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs tabular-nums ${
                      m.score >= threshold ? "text-success border-success/30" : "text-muted-foreground"
                    }`}>
                      {(m.score * 100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
