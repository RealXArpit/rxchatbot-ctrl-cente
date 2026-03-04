import { useState } from "react";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Bot, User } from "lucide-react";
import { runTestbench, type TestbenchResult } from "@/lib/mock-kb";
import { MatchScoringTable } from "./MatchScoringTable";

export function TestbenchPanel() {
  const { env } = useParams<{ env: string }>();
  const [query, setQuery] = useState("");
  const [threshold, setThreshold] = useState(0.72);
  const [result, setResult] = useState<TestbenchResult | null>(null);

  const handleRun = () => {
    if (!query.trim()) return;
    setResult(runTestbench(env ?? "dev", query, threshold));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[250px]">
          <Label className="text-xs mb-1 block">Query</Label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a user query to test..."
            className="h-9 text-sm"
            maxLength={500}
            onKeyDown={(e) => e.key === "Enter" && handleRun()}
          />
        </div>
        <div className="w-48">
          <Label className="text-xs mb-1 block">Threshold: {threshold.toFixed(2)}</Label>
          <Slider value={[threshold]} onValueChange={([v]) => setThreshold(v)} min={0.1} max={1} step={0.01} />
        </div>
        <Button size="sm" className="gap-1.5" onClick={handleRun} disabled={!query.trim()}>
          <Search className="h-3.5 w-3.5" /> Run
        </Button>
      </div>

      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Routing Decision</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Routed to:</span>
                {result.routedTo === "BOT" ? (
                  <Badge className="bg-success/10 text-success border-success/30 gap-1"><Bot className="h-3 w-3" />BOT</Badge>
                ) : (
                  <Badge className="bg-warning/10 text-warning border-warning/30 gap-1"><User className="h-3 w-3" />HUMAN</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <span className="text-sm font-medium tabular-nums">{(result.confidence * 100).toFixed(0)}%</span>
                <Badge variant="outline" className={`text-[10px] ${
                  result.confidence >= 0.72 ? "text-success border-success/30" :
                  result.confidence >= 0.55 ? "text-warning border-warning/30" :
                  "text-destructive border-destructive/30"
                }`}>
                  {result.confidence >= 0.72 ? "High" : result.confidence >= 0.55 ? "Medium" : "Low"}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Answer:</span>
                <p className="text-xs text-foreground/80 whitespace-pre-line bg-muted/30 rounded-md p-2 border border-border">{result.finalAnswer}</p>
              </div>
            </CardContent>
          </Card>

          <MatchScoringTable matches={result.topMatches} threshold={threshold} />
        </div>
      )}
    </div>
  );
}
