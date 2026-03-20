import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CuratedKbRow {
  id: string;
  question: string;
  answer: string;
  keywords: string | null;
  category: string | null;
  status: 'DRAFT' | 'PROPOSED' | 'PUBLISHED' | 'ARCHIVED';
  escalation_id: string | null;
  session_id: string | null;
  created_by: string | null;
  created_at: string;
  proposed_by: string | null;
  published_by: string | null;
  published_at: string | null;
  archived_by: string | null;
  archived_at: string | null;
}

export function useCuratedKb() {
  return useQuery({
    queryKey: ['curated_kb'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('curated_kb')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as CuratedKbRow[];
    },
    refetchInterval: 30000,
  });
}

export function useUpdateCuratedKbStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('curated_kb')
        .update(payload.updates)
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curated_kb'] });
    },
  });
}
