import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useEscalationWatcher(env: string) {
  const navigate = useNavigate();
  const seenIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const { data } = useQuery({
    queryKey: ["escalation_watcher"],
    queryFn: async () => {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("escalations")
        .select("id, priority, escalation_reason, status, created_at")
        .eq("status", "OPEN")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!data) return;

    if (isFirstLoad.current) {
      data.forEach((t) => seenIds.current.add(t.id));
      isFirstLoad.current = false;
      return;
    }

    data.forEach((ticket) => {
      if (seenIds.current.has(ticket.id)) return;
      seenIds.current.add(ticket.id);

      const isUrgent = ticket.priority === "HIGH";
      const reason = (ticket.escalation_reason ?? "").replace(/_/g, " ");

      toast[isUrgent ? "error" : "warning"](
        isUrgent ? `🚨 URGENT Escalation — ${reason}` : `⚠️ New Escalation — ${reason}`,
        {
          duration: Infinity,
          action: {
            label: "View Now",
            onClick: () => navigate(`/realx/${env}/escalations/${ticket.id}`),
          },
          description: isUrgent
            ? "This requires immediate attention."
            : "A new escalation has been raised.",
        }
      );
    });
  }, [data, navigate, env]);
}
