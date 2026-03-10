import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useKbItems() {
  return useQuery({
    queryKey: ['knowledge_base'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60000,
  });
}

export function useUpdateKbItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      id: string;
      category: string;
      question: string;
      answer: string;
      keywords: string;
    }) => {
      const { error } = await supabase
        .from('knowledge_base')
        .update({
          category: item.category,
          question: item.question,
          answer: item.answer,
          keywords: item.keywords,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_base'] });
    },
  });
}
