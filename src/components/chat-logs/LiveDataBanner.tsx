import { useState } from "react";
import { Info, X } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useNavigate } from "react-router-dom";

const DISMISS_KEY = "rxchat_live_banner_dismissed";

export function LiveDataBanner() {
  const { env } = useTenant();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === "1");

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 shrink-0" />
        <span>
          Showing mock data.{" "}
          <button
            onClick={() => navigate(`/realx/${env}/integrations`)}
            className="underline underline-offset-2 font-medium hover:text-foreground transition-colors"
          >
            Connect Supabase
          </button>{" "}
          to see live logs.
        </span>
      </div>
      <button onClick={handleDismiss} className="text-warning hover:text-foreground transition-colors shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
