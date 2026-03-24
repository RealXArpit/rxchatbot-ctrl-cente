import { useState, useCallback, useRef, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import type { TestChatMessage, TestChatSession } from "@/types/test-chat";
import { toast } from "@/hooks/use-toast";
import { appendTestSession } from "@/lib/mock-conversations";
import { saveSessionToHistory } from "@/components/test-chat/SessionHistoryDrawer";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "rxchat_test_session_id";

function getOrCreateSessionId(env: string): string {
  const key = `${SESSION_KEY}_${env}`;
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const id = `admin_test_${env}_${crypto.randomUUID()}`;
  localStorage.setItem(key, id);
  return id;
}

function clearStoredSessionId(env: string) {
  localStorage.removeItem(`${SESSION_KEY}_${env}`);
}

export function useTestChat() {
  const { client, env } = useTenant();
  const { session: authSession } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [messages, setMessages] = useState<TestChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef<string>("");
  const prevEnvRef = useRef(env);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const seenAgentMessageIds = useRef<Set<string>>(new Set());

  // Reset on env change
  useEffect(() => {
    if (prevEnvRef.current !== env) {
      setMessages([]);
      sessionIdRef.current = "";
      prevEnvRef.current = env;
    }
  }, [env]);

  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = getOrCreateSessionId(env);
    }
    return sessionIdRef.current;
  }, [env]);

  const session: TestChatSession = {
    sessionId: sessionIdRef.current || "",
    env,
    messages,
    startedAt: messages[0]?.sentAt ?? new Date().toISOString(),
  };

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggleDebug = useCallback(() => setShowDebug((p) => !p), []);

  const persistSession = useCallback((sid: string, msgs: TestChatMessage[]) => {
    const nonErrorMsgs = msgs.filter((m) => m.role !== "error" && !m.isLoading);
    if (nonErrorMsgs.length < 2) return;

    // Persist to mock conversation store
    appendTestSession(
      sid,
      env,
      nonErrorMsgs[0]?.sentAt ?? new Date().toISOString(),
      nonErrorMsgs.map((m) => ({ role: m.role, text: m.text, sentAt: m.sentAt, meta: m.meta as Record<string, unknown> | undefined })),
    );

    // Persist to localStorage history
    const firstUserMsg = nonErrorMsgs.find((m) => m.role === "user");
    saveSessionToHistory({
      sessionId: sid,
      env,
      startedAt: nonErrorMsgs[0]?.sentAt ?? new Date().toISOString(),
      messageCount: nonErrorMsgs.length,
      lastMessage: firstUserMsg?.text ?? "Test session",
      messages: nonErrorMsgs,
    });
  }, [env]);

  const sendMessage = useCallback(async (text: string) => {
    if (!client || !text.trim()) return;
    const sid = getSessionId();
    const userId = authSession?.user.id ?? "anonymous";

    const userMsg: TestChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: text.trim(),
      sentAt: new Date().toISOString(),
    };

    const loadingMsg: TestChatMessage = {
      id: crypto.randomUUID(),
      role: "bot",
      text: "",
      sentAt: new Date().toISOString(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      const res = await client.sendMessage({
        channel: "ADMIN_TEST",
        userId,
        sessionId: sid,
        userMessage: text.trim(),
      });

      const botMsg: TestChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        text: res.answer,
        sentAt: res.timestamp,
        feedback: null,
        meta: {
          logId: res.logId,
          routedTo: res.routedTo,
          confidence: res.confidence,
          cacheHit: res.cacheHit,
          citations: res.citations,
          sessionId: res.sessionId,
          tokensUsed: res.tokensUsed,
          escalationReason: res.escalationReason,
          suggestedFollowUp: res.suggestedFollowUp,
        },
      };

      setMessages((prev) => {
        const updated = [...prev.slice(0, -1), botMsg];
        // Persist after each successful exchange
        persistSession(sid, updated);
        return updated;
      });
    } catch (err) {
      const errorMsg: TestChatMessage = {
        id: crypto.randomUUID(),
        role: "error",
        text:
          err instanceof Error
            ? `Could not reach the n8n workflow. ${err.message}\n\nMake sure n8n is running and the workflow is Published.`
            : "Could not reach the n8n workflow. Make sure n8n is running and the workflow is Published.",
        sentAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev.slice(0, -1), errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [client, getSessionId, authSession, persistSession]);

  const sendFeedback = useCallback(async (logId: string, vote: 1 | -1) => {
    if (!client) return;
    try {
      await client.sendFeedback({ logId, feedback: vote });
      setMessages((prev) =>
        prev.map((m) =>
          m.meta?.logId === logId ? { ...m, feedback: vote } : m
        )
      );
      toast({ title: "Feedback sent — thank you!" });
    } catch {
      toast({ title: "Failed to send feedback", variant: "destructive" });
    }
  }, [client]);


  const clearSession = useCallback(() => {
    clearStoredSessionId(env);
    sessionIdRef.current = "";
    setMessages([]);
  }, [env]);

  const restoreSession = useCallback((msgs: TestChatMessage[]) => {
    setMessages(msgs);
  }, []);

  return {
    session,
    isOpen,
    isLoading,
    open,
    close,
    sendMessage,
    sendFeedback,
    clearSession,
    showDebug,
    toggleDebug,
    restoreSession,
  };
}
