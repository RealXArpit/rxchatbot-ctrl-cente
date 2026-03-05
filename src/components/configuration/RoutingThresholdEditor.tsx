import { useState } from "react";
import { ConfigSectionCard } from "./ConfigSectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { RoutingConfig } from "@/lib/mock-config";

interface RoutingThresholdEditorProps {
  config: RoutingConfig;
  readOnly: boolean;
  onChange: (config: RoutingConfig) => void;
}

export function RoutingThresholdEditor({ config, readOnly, onChange }: RoutingThresholdEditorProps) {
  const [threshold, setThreshold] = useState(String(config.threshold));
  const [high, setHigh] = useState(String(config.confidenceBands.high));
  const [medium, setMedium] = useState(String(config.confidenceBands.medium));
  const [dirty, setDirty] = useState(false);

  const handleSave = () => {
    const t = Number(threshold);
    const h = Number(high);
    const m = Number(medium);
    if (isNaN(t) || t < 0 || t > 1 || isNaN(h) || isNaN(m)) {
      toast({ title: "Validation error", description: "Values must be between 0 and 1.", variant: "destructive" });
      return;
    }
    onChange({ threshold: t, confidenceBands: { high: h, medium: m } });
    setDirty(false);
    toast({ title: "Routing updated", description: "Changes staged — propose a version to apply." });
  };

  const update = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setDirty(true);
  };

  return (
    <ConfigSectionCard title="Routing Thresholds" description="Confidence-based routing to BOT or HUMAN." readOnly={readOnly}>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Routing Threshold</Label>
          <Input value={threshold} onChange={update(setThreshold)} disabled={readOnly} className="h-8 font-mono text-sm" />
          <p className="text-[10px] text-muted-foreground">Queries above this → BOT</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">High Band ≥</Label>
          <Input value={high} onChange={update(setHigh)} disabled={readOnly} className="h-8 font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Medium Band ≥</Label>
          <Input value={medium} onChange={update(setMedium)} disabled={readOnly} className="h-8 font-mono text-sm" />
        </div>
      </div>
      {!readOnly && dirty && (
        <Button size="sm" className="mt-4" onClick={handleSave}>Stage Changes</Button>
      )}
    </ConfigSectionCard>
  );
}
