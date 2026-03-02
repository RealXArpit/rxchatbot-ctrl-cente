import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { EyeOff, Eye } from "lucide-react";

interface PiiToggleProps {
  showRaw: boolean;
  onChange: (show: boolean) => void;
}

export function PiiToggle({ showRaw, onChange }: PiiToggleProps) {
  const { session } = useAuth();
  const isAuditor = session?.user.role === "Auditor";

  return (
    <div className="flex items-center gap-2">
      {showRaw ? (
        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <Switch
        checked={showRaw}
        onCheckedChange={onChange}
        disabled={isAuditor}
        id="pii-toggle"
      />
      <Label htmlFor="pii-toggle" className="text-xs text-muted-foreground cursor-pointer">
        {isAuditor ? "PII redacted (auditor)" : showRaw ? "Showing raw" : "PII redacted"}
      </Label>
    </div>
  );
}
