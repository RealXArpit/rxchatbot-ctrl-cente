import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useChatLogs() {
  return useQuery({
    queryKey: ['chat_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });
}
