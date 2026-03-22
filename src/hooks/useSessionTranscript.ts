import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/mock-conversations';

export function useSessionTranscript(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: ['session_transcript', sessionId],
    enabled: typeof sessionId === 'string' && sessionId.length > 0,
    staleTime: 0,
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('sessions')
        .select('id, session_id, role, message, turn, timestamp')
        .eq('session_id', sessionId)
        .order('turn', { ascending: true })
        .order('timestamp', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      return data
        .filter((row) => typeof row.message === 'string' && row.message.trim().length > 0)
        .map((row, i): Message => ({
          id: row.id ?? `msg_${i}`,
          conversationId: sessionId,
          role: row.role === 'assistant' ? 'bot' : row.role === 'user' ? 'user' : 'agent',
          text: row.message,
          textRedacted: row.message,
          createdAt: row.timestamp ?? new Date().toISOString(),
          piiRedacted: false,
          feedback: null,
          adminReferenceAnswer: null,
        }));
    },
  });
}
