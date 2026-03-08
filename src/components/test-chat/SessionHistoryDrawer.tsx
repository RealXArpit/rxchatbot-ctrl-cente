import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import type { TestChatMessage } from "@/types/test-chat";

const HISTORY_KEY = "rxchat_test_history";
const MAX_ENTRIES = 10;

export interface SessionHistoryEntry {
  sessionId: string;
  env: "dev" | "prod";
  startedAt: string;
  messageCount: number;
  lastMessage: string;
  messages: TestChatMessage[];
}

export function getSessionHistory(): SessionHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveSessionToHistory(entry: SessionHistoryEntry) {
  const history = getSessionHistory().filter((h) => h.sessionId !== entry.sessionId);
  history.unshift(entry);
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearSessionHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore?: (messages: TestChatMessage[]) => void;
  currentEnv: string;
}

export function SessionHistoryDrawer({ open, onOpenChange, onRestore, currentEnv }: Props) {
  const history = getSessionHistory();

  const handleRestore = (entry: SessionHistoryEntry) => {
    onRestore?.(entry.messages);
    onOpenChange(false);
  };

  const handleClear = () => {
    clearSessionHistory();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Session History</SheetTitle>
          <SheetDescription>Last {MAX_ENTRIES} test sessions stored locally.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No past sessions found.</p>
          )}
          {history.map((entry) => (
            <button
              key={entry.sessionId}
              onClick={() => handleRestore(entry)}
              className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${entry.env === "prod" ? "border-destructive/40 text-destructive" : "border-warning/40 text-warning"}`}
                >
                  {entry.env.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(entry.startedAt), "d MMM yyyy HH:mm")}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{entry.messageCount} msgs</span>
              </div>
              <p className="text-xs text-foreground truncate">{entry.lastMessage}</p>
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <SheetFooter className="mt-4">
            <Button variant="destructive" size="sm" onClick={handleClear} className="w-full gap-2">
              <Trash2 className="h-3.5 w-3.5" />
              Clear all history
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
