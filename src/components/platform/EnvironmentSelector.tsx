import { useNavigate, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

export function EnvironmentSelector() {
  const { env } = useParams<{ env: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract everything after /realx/:env/
  const parts = location.pathname.split("/");
  // parts = ["", "realx", env, module, sub1, sub2, ...]
  const rest = parts.slice(3).join("/") || "overview";

  const switchTo = (target: "dev" | "prod") => {
    if (target !== env) {
      navigate(`/realx/${target}/${currentModule}`);
    }
  };

  return (
    <div className="flex items-center rounded-md border border-border bg-muted p-0.5 text-xs font-medium">
      <button
        onClick={() => switchTo("dev")}
        className={cn(
          "rounded px-3 py-1 transition-colors",
          env === "dev" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Dev
      </button>
      <button
        onClick={() => switchTo("prod")}
        className={cn(
          "rounded px-3 py-1 transition-colors",
          env === "prod" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Prod
      </button>
    </div>
  );
}
