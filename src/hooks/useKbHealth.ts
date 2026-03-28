import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface KbHealthEntry {
  id: string;
  category: string;
  question: string;
  feedback_score: number;
  use_count: number;
  updated_at: string;
  status: string;
  negative_feedback_count: number;
  high_confidence_negatives: number;
}

export interface FeedbackSignal {
  log_id: string;
  user_message: string;
  ai_answer: string;
  confidence: number;
  feedback: number;
  timestamp: string;
  kb_id: string;
  kb_question: string;
}

export function useKbHealth() {
  return useQuery({
    queryKey: ['kb_health'],
    queryFn: async () => {
      // Fetch all active KB entries with scores
      const { data: kbData, error: kbError } = await supabase
        .from('knowledge_base')
        .select('id, category, question, feedback_score, use_count, updated_at, status')
        .not('status', 'in', '("DEPRECATED","ARCHIVED")')
        .order('feedback_score', { ascending: true });
      if (kbError) throw kbError;

      // Fetch recent feedback signals from chat_logs
      const { data: logData, error: logError } = await supabase
        .from('chat_logs')
        .select('id, user_message, ai_answer, confidence, feedback, timestamp, citations')
        .not('feedback', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(200);
      if (logError) throw logError;

      // Build a map of kb_id → negative feedback counts
      const negativeMap: Record<string, { total: number; highConf: number }> = {};
      for (const log of logData ?? []) {
        if (log.feedback !== -1) continue;
        const cites: string[] = Array.isArray(log.citations) ? log.citations : [];
        for (const kbId of cites) {
          if (!negativeMap[kbId]) negativeMap[kbId] = { total: 0, highConf: 0 };
          negativeMap[kbId].total += 1;
          if ((log.confidence ?? 0) >= 0.8) negativeMap[kbId].highConf += 1;
        }
      }

      const entries: KbHealthEntry[] = (kbData ?? []).map(row => ({
        ...row,
        feedback_score: Number(row.feedback_score ?? 0),
        use_count: Number(row.use_count ?? 0),
        negative_feedback_count: negativeMap[row.id]?.total ?? 0,
        high_confidence_negatives: negativeMap[row.id]?.highConf ?? 0,
      }));

      // Score distribution buckets
      const distribution = {
        negative:  entries.filter(e => e.feedback_score < 0).length,
        low:       entries.filter(e => e.feedback_score >= 0 && e.feedback_score < 2).length,
        neutral:   entries.filter(e => e.feedback_score >= 2 && e.feedback_score < 5).length,
        good:      entries.filter(e => e.feedback_score >= 5 && e.feedback_score < 8).length,
        strong:    entries.filter(e => e.feedback_score >= 8).length,
      };

      // Needs review: any of three conditions
      const needsReview = entries.filter(e =>
        (e.feedback_score < 2 && e.use_count >= 3) ||
        (e.high_confidence_negatives >= 1) ||
        (e.feedback_score < 0)
      );

      // Untested: used 0 times by real users
      const untested = entries.filter(e => e.use_count === 0);

      // Top performers
      const topPerformers = [...entries]
        .filter(e => e.use_count >= 2)
        .sort((a, b) => b.feedback_score - a.feedback_score)
        .slice(0, 10);

      // Recent feedback signals with KB context
      const kbMap = Object.fromEntries((kbData ?? []).map(k => [k.id, k.question]));
      const signals: FeedbackSignal[] = (logData ?? [])
        .flatMap(log => {
          const cites: string[] = Array.isArray(log.citations) ? log.citations : [];
          return cites.map(kbId => ({
            log_id: log.id,
            user_message: log.user_message ?? '',
            ai_answer: (log.ai_answer ?? '').slice(0, 120),
            confidence: Number(log.confidence ?? 0),
            feedback: Number(log.feedback),
            timestamp: log.timestamp ?? '',
            kb_id: kbId,
            kb_question: kbMap[kbId] ?? 'Unknown entry',
          }));
        })
        .slice(0, 50);

      return { entries, distribution, needsReview, untested, topPerformers, signals };
    },
    refetchInterval: 60000,
  });
}
