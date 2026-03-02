import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function ExportButton() {
  const { session } = useAuth();
  const canExport = session?.user.role === "SuperAdmin" || session?.user.role === "OpsManager";

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your chat logs export is being prepared (mock).",
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-xs gap-1.5"
      disabled={!canExport}
      onClick={handleExport}
      title={canExport ? "Export conversations" : "Export is restricted to SuperAdmin and OpsManager"}
    >
      <Download className="h-3 w-3" /> Export
    </Button>
  );
}
