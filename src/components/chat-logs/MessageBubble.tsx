import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Bot, User, Headphones, Settings } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "bot" | "agent" | "system";
  text: string;
  createdAt: string;
}

const roleConfig: Record<string, { icon: React.ElementType; label: string; alignment: string; bubbleClass: string }> = {
  user: { icon: User, label: "User", alignment: "justify-end", bubbleClass: "bg-primary/10 text-foreground" },
  bot: { icon: Bot, label: "Bot", alignment: "justify-start", bubbleClass: "bg-secondary/10 text-foreground" },
  agent: { icon: Headphones, label: "Agent", alignment: "justify-start", bubbleClass: "bg-warning/10 text-foreground" },
  system: { icon: Settings, label: "System", alignment: "justify-center", bubbleClass: "bg-muted text-muted-foreground" },
};

export function MessageBubble({ role, text, createdAt }: MessageBubbleProps) {
  const config = roleConfig[role] ?? roleConfig.system;
  const Icon = config.icon;
  const time = format(parseISO(createdAt), "HH:mm:ss");

  if (role === "system") {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] bg-muted text-muted-foreground">
          <Icon className="h-3 w-3" />
          <span>{text}</span>
          <span className="tabular-nums opacity-60">· {time}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", config.alignment)}>
      {role !== "user" && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}
      <div className="max-w-[75%]">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[11px] font-medium text-muted-foreground">{config.label}</span>
          <span className="text-[10px] tabular-nums text-muted-foreground/60">{time}</span>
        </div>
        <div className={cn("rounded-lg px-3 py-2 text-sm leading-relaxed", config.bubbleClass)}>
          {text}
        </div>
      </div>
      {role === "user" && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
    </div>
  );
}
