import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export function usePublishedCuratedQuestions() {
  return useQuery({
    queryKey: ['curated_kb_published_questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('curated_kb')
        .select('id, question')
        .eq('status', 'PUBLISHED');
      if (error) throw error;
      return (data ?? []).map(r => r.question?.toLowerCase().trim() ?? '');
    },
    refetchInterval: 60000,
  });
}

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
    onError: (error) => {
      console.error('KB update failed:', error);
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
    },
  });
}

export function useAddKbItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      category: string;
      question: string;
      answer: string;
      keywords: string;
    }) => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          category: item.category,
          question: item.question,
          answer: item.answer,
          keywords: item.keywords,
          status: 'ACTIVE',
          feedback_score: 0,
          use_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_base'] });
    },
  });
}

export function useDeprecateKbItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ status: 'DEPRECATED', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_base'] });
    },
  });
}
