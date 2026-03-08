import { CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  sessionId: string;
  sentAt: Date;
}

export function AgentPollBanner({ sessionId, sentAt }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
      <CheckCircle className="h-4 w-4 shrink-0" />
      <span>
        Message delivered to session{" "}
        <span className="font-mono text-xs">{sessionId.slice(0, 20)}…</span>
        {" · "}
        <span className="tabular-nums text-xs">{format(sentAt, "HH:mm:ss")}</span>
      </span>
    </div>
  );
}
