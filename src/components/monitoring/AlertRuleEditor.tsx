import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AlertRule } from "@/lib/mock-monitoring";
import { METRIC_OPTIONS, OPERATOR_OPTIONS, WINDOW_OPTIONS, SEVERITY_OPTIONS } from "@/lib/mock-monitoring";

interface AlertRuleEditorProps {
  open: boolean;
  onClose: () => void;
  rule: AlertRule | null; // null = create
  onSave: (data: {
    name: string;
    metric: string;
    operator: string;
    threshold: number;
    window: string;
    severity: "critical" | "warning" | "info";
    enabled: boolean;
  }) => void;
}

export function AlertRuleEditor({ open, onClose, rule, onSave }: AlertRuleEditorProps) {
  const [name, setName] = useState(rule?.name ?? "");
  const [metric, setMetric] = useState(rule?.metric ?? METRIC_OPTIONS[0].value);
  const [operator, setOperator] = useState<string>(rule?.operator ?? ">");
  const [threshold, setThreshold] = useState(String(rule?.threshold ?? ""));
  const [window, setWindow] = useState(rule?.window ?? "60m");
  const [severity, setSeverity] = useState<"critical" | "warning" | "info">(rule?.severity ?? "warning");
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Required";
    if (!threshold || isNaN(Number(threshold))) e.threshold = "Must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      metric,
      operator,
      threshold: Number(threshold),
      window,
      severity,
      enabled,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Alert Rule" : "New Alert Rule"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ar-name">Name</Label>
            <Input id="ar-name" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Metric</Label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Operator</Label>
              <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger className="h-9 text-sm font-mono"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPERATOR_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o} className="font-mono">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Threshold</Label>
              <Input value={threshold} onChange={(e) => setThreshold(e.target.value)} className="h-9 font-mono" />
              {errors.threshold && <p className="text-xs text-destructive">{errors.threshold}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Window</Label>
              <Select value={window} onValueChange={setWindow}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WINDOW_OPTIONS.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="ar-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="ar-enabled">Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{rule ? "Save Changes" : "Create Rule"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
