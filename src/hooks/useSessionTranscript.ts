import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/mock-conversations';

export function useSessionTranscript(sessionId: string | null | undefined) {
  const queryClient = useQueryClient();
  const isValidSessionId =
    typeof sessionId === 'string' && sessionId.length > 10 && sessionId !== 'error-session';

  const query = useQuery({
    queryKey: ['session_transcript', sessionId],
    enabled: isValidSessionId,
    staleTime: 0,
    queryFn: async () => {
      if (!isValidSessionId || !sessionId) return [];
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

  // Supabase Realtime subscription — refetch whenever a new message
  // is inserted into the sessions table for this session_id.
  useEffect(() => {
    if (!isValidSessionId || !sessionId) return;

    // Channel names must be unique per hook instance; reusing the same
    // name across multiple mounts causes "cannot add callbacks after subscribe".
    const channelName = `session_transcript_${sessionId}_${Math.random().toString(36).slice(2, 9)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sessions',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['session_transcript', sessionId],
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, isValidSessionId, queryClient]);

  return query;
}
