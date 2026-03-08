import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTestChat } from "@/hooks/useTestChat";
import { TestChatWindow } from "./TestChatWindow";
import type { Role } from "@/lib/mock-api";

const ALLOWED_ROLES: Role[] = ["SuperAdmin", "OpsManager", "KnowledgeManager"];

export function TestChatWidget() {
  const { session: authSession } = useAuth();
  const chat = useTestChat();

  if (!authSession || !ALLOWED_ROLES.includes(authSession.user.role)) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {chat.isOpen && (
        <TestChatWindow
          session={chat.session}
          isLoading={chat.isLoading}
          showDebug={chat.showDebug}
          onSend={chat.sendMessage}
          onFeedback={chat.sendFeedback}
          onClear={chat.clearSession}
          onClose={chat.close}
          onToggleDebug={chat.toggleDebug}
          onRestoreSession={chat.restoreSession}
        />
      )}
      {!chat.isOpen && (
        <button
          onClick={chat.open}
          className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 h-11 shadow-lg hover:bg-primary/90 transition-colors hover-scale"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">Test Chat</span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
        </button>
      )}
    </div>
  );
}
