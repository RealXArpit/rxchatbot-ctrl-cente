import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EscalationTicket, Priority, TicketStatus, SlaPolicy } from '@/lib/mock-escalations';

const SLA_MAP: Record<string, SlaPolicy> = {
  HIGH:     { firstResponseMinutes: 5,  resolutionHours: 2  },
  STANDARD: { firstResponseMinutes: 60, resolutionHours: 24 },
  MEDIA:    { firstResponseMinutes: 30, resolutionHours: 8  },
};

function mapRow(row: any): EscalationTicket {
  const priority: Priority =
    row.priority === 'HIGH' ? 'P0' :
    row.priority === 'STANDARD' ? 'P1' : 'P2';

  const sla = SLA_MAP[row.priority] ?? SLA_MAP['STANDARD'];

  return {
    id:               row.id ?? '',
    tenantId:         'realx',
    env:              'prod',
    priority,
    status:           (row.status ?? 'OPEN') as TicketStatus,
    channel:          row.channel ?? 'WEBSITE',
    conversationId:   row.id ?? '',
    sessionId:        row.session_id ?? '',
    escalatedAt:      row.created_at ?? new Date().toISOString(),
    firstAgentReplyAt: row.first_agent_reply_at ?? null,
    resolvedAt:       row.resolved_at ?? null,
    assigneeId:       row.assigned_to ?? null,
    assigneeName:     row.assigned_to ?? null,
    reason:           (row.escalation_reason ?? 'LOW_CONFIDENCE') as any,
    sla,
    resolutionNote:   row.resolution_note ?? null,
    outcome:          row.outcome ?? null,
    notes:            [],
    replies:          [],
  };
}

export function useEscalations() {
  return useQuery({
    queryKey: ['escalations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    refetchInterval: 30000,
  });
}

export function useEscalationById(id: string | undefined) {
  return useQuery({
    queryKey: ['escalation', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('escalations')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data ? mapRow(data) : null;
    },
    refetchInterval: 15000,
  });
}

export function useUpdateEscalationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      status?: string;
      assigned_to?: string;
      resolution_note?: string;
      outcome?: string;
      resolved_at?: string;
    }) => {
      const { id, ...updates } = payload;
      const { error } = await supabase
        .from('escalations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      queryClient.invalidateQueries({ queryKey: ['escalation', variables.id] });
    },
  });
}
