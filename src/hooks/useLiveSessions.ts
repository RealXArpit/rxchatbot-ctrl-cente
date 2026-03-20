import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface LiveSession {
  id: string;
  session_id: string;
  channel: string;
  last_message: string;
  turn_count: number;
  avg_confidence: number;
  last_message_at: string;
  is_active: boolean;
}

export function useLiveSessions() {
  return useQuery({
    queryKey: ['live_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((row: any): LiveSession => ({
        id: row.id ?? '',
        session_id: row.session_id ?? '',
        channel: row.channel ?? 'WEBSITE',
        last_message: row.last_message ?? '',
        turn_count: row.turn_count ?? 0,
        avg_confidence: row.avg_confidence ?? 0,
        last_message_at: row.last_message_at ?? '',
        is_active: row.is_active ?? false,
      }));
    },
    refetchInterval: 10000,
  });
}
