import { WifiOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ChannelConnectionBanner() {
  const navigate = useNavigate();
  const { env } = useParams<{ env: string }>();

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 border-b border-warning/20 text-xs">
      <WifiOff className="h-3.5 w-3.5 text-warning shrink-0" />
      <span className="text-warning-foreground">Channel not connected — replies are stored but not delivered.</span>
      <Button
        variant="link"
        size="sm"
        className="ml-auto text-xs h-auto p-0 text-primary"
        onClick={() => navigate(`/realx/${env}/integrations`)}
      >
        Connect Channel in Integrations
      </Button>
    </div>
  );
}
