import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/mock-conversations';

export function useSessionTranscript(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session_transcript', sessionId],
    enabled: Boolean(sessionId) && sessionId !== '',
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('sessions')
        .select('id, session_id, role, message, turn, timestamp')
        .eq('session_id', sessionId)
        .order('turn', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      return data.map((row, i): Message => ({
        id: row.id ?? `msg_${i}`,
        conversationId: sessionId,
        role: row.role === 'assistant' ? 'bot' : row.role === 'user' ? 'user' : 'agent',
        text: row.message ?? '',
        textRedacted: row.message ?? '',
        createdAt: row.timestamp ?? new Date().toISOString(),
        piiRedacted: false,
        feedback: null,
        adminReferenceAnswer: null,
      }));
    },
    staleTime: 30000,
  });
}
