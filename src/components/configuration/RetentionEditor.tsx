import { useState } from "react";
import { ConfigSectionCard } from "./ConfigSectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { RetentionConfig } from "@/lib/mock-config";

interface RetentionEditorProps {
  config: RetentionConfig;
  readOnly: boolean;
  onChange: (config: RetentionConfig) => void;
}

export function RetentionEditor({ config, readOnly, onChange }: RetentionEditorProps) {
  const [form, setForm] = useState({ ...config });
  const [dirty, setDirty] = useState(false);

  const set = (key: keyof RetentionConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }));
    setDirty(true);
  };

  const handleSave = () => {
    onChange(form);
    setDirty(false);
    toast({ title: "Retention updated", description: "Changes staged — propose a version to apply." });
  };

  return (
    <ConfigSectionCard title="Data Retention" description="Retention periods for stored data. SuperAdmin only." readOnly={readOnly}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Messages (days)</Label>
          <Input type="number" value={form.messagesDays} onChange={set("messagesDays")} disabled={readOnly} className="h-8 font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Escalations (days)</Label>
          <Input type="number" value={form.escalationsDays} onChange={set("escalationsDays")} disabled={readOnly} className="h-8 font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Audit logs (years)</Label>
          <Input type="number" value={form.auditLogsYears} onChange={set("auditLogsYears")} disabled={readOnly} className="h-8 font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cache TTL (days)</Label>
          <Input type="number" value={form.cacheTTLdays} onChange={set("cacheTTLdays")} disabled={readOnly} className="h-8 font-mono text-sm" />
        </div>
      </div>
      {!readOnly && dirty && (
        <Button size="sm" className="mt-4" onClick={handleSave}>Stage Changes</Button>
      )}
    </ConfigSectionCard>
  );
}
