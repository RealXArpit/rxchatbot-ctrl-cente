import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FeedbackEvent, KbFeedbackScore, FeedbackSummary } from '@/lib/mock-feedback';

export function useFeedbackEvents() {
  return useQuery({
    queryKey: ['feedback_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('id, session_id, user_message, ai_answer, feedback, feedback_at, channel, routed_to, confidence, citations')
        .not('feedback', 'is', null)
        .order('feedback_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((row): FeedbackEvent => ({
        id:          row.id,
        logId:       row.id,
        sessionId:   row.session_id ?? '',
        userMessage: row.user_message ?? '',
        botAnswer:   row.ai_answer ?? '',
        feedback:    row.feedback === 1 ? 1 : -1,
        feedbackAt:  row.feedback_at ?? new Date().toISOString(),
        channel:     row.channel ?? 'WEBSITE',
        routedTo:    row.routed_to === 'BOT' ? 'BOT' : 'HUMAN',
        confidence:  row.confidence ?? 0,
        citations:   Array.isArray(row.citations) ? row.citations : [],
      }));
    },
    refetchInterval: 60000,
  });
}

export function useFeedbackSummary() {
  return useQuery({
    queryKey: ['feedback_summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('feedback, confidence')
        .not('feedback', 'is', null);
      if (error) throw error;
      const events = data ?? [];
      const pos = events.filter((e) => e.feedback === 1);
      const neg = events.filter((e) => e.feedback === -1);
      const avgConf = pos.length
        ? pos.reduce((s, e) => s + (e.confidence ?? 0), 0) / pos.length
        : 0;
      const summary: FeedbackSummary = {
        totalFeedback: events.length,
        positiveCount: pos.length,
        negativeCount: neg.length,
        satisfactionRate: events.length ? pos.length / events.length : 0,
        avgConfidenceOnPositive: avgConf,
      };
      return summary;
    },
    refetchInterval: 60000,
  });
}
