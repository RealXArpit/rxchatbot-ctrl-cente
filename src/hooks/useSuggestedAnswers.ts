import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SuggestedAnswer {
  id: string;
  user_message: string;
  original_answer: string;
  suggested_answer: string;
  suggested_by: string;
  status: string;
  suggested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export function useSuggestedAnswers() {
  return useQuery({
    queryKey: ['suggested_answers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suggested_answers')
        .select('*')
        .order('suggested_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as SuggestedAnswer[];
    },
    refetchInterval: 30000,
  });
}

export function useReviewSuggestedAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; status: 'APPROVED' | 'REJECTED'; reviewed_by: string }) => {
      const { error } = await supabase
        .from('suggested_answers')
        .update({
          status: payload.status,
          reviewed_by: payload.reviewed_by,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested_answers'] });
    },
  });
}
