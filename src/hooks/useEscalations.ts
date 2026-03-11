import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EscalationTicket, Priority, TicketStatus, SlaPolicy } from '@/lib/mock-escalations';

const SLA_MAP: Record<string, SlaPolicy> = {
  HIGH:     { firstResponseMinutes: 5,  resolutionHours: 2  },
  STANDARD: { firstResponseMinutes: 15, resolutionHours: 6  },
  MEDIA:    { firstResponseMinutes: 60, resolutionHours: 24 },
  DEFAULT:  { firstResponseMinutes: 60, resolutionHours: 24 },
};

function mapPriority(p: string | null): Priority {
  if (p === 'HIGH')     return 'P0';
  if (p === 'STANDARD') return 'P1';
  if (p === 'MEDIA')    return 'P2';
  return 'P2';
}

function mapStatus(s: string | null): TicketStatus {
  if (s === 'RESOLVED') return 'RESOLVED';
  if (s === 'CLOSED')   return 'CLOSED';
  if (s === 'IN_PROGRESS' || s === 'ASSIGNED') return 'IN_PROGRESS';
  return 'OPEN';
}

function mapRow(row: any): EscalationTicket {
  const priority = mapPriority(row.escalation_priority);
  const sla = SLA_MAP[row.escalation_priority ?? 'DEFAULT'] ?? SLA_MAP.DEFAULT;
  return {
    id:                row.id ?? '',
    tenantId:          'realx',
    env:               'prod',
    priority,
    status:            mapStatus(row.status),
    channel:           row.channel ?? 'WEBSITE',
    conversationId:    row.id ?? '',
    sessionId:         row.session_id ?? '',
    escalatedAt:       row.created_at ?? new Date().toISOString(),
    firstAgentReplyAt: row.agent_reply ? row.created_at : null,
    resolvedAt:        row.resolved_at ?? null,
    assigneeId:        row.assigned_to ?? null,
    assigneeName:      row.assigned_to ?? null,
    reason:            (row.escalation_reason ?? 'LOW_CONFIDENCE') as any,
    sla,
    resolutionNote:    row.resolution_note ?? null,
    outcome:           row.outcome ?? null,
    notes:             [],
    replies:           row.agent_reply
      ? [{ id: `r_${row.id}`, ticketId: row.id, authorId: row.assigned_to ?? 'agent',
           authorName: 'Agent', text: row.agent_reply, createdAt: row.resolved_at ?? row.created_at }]
      : [],
  };
}

export function useEscalations(queue: 'unassigned' | 'mine' | 'all', userId: string) {
  return useQuery({
    queryKey: ['escalations', queue, userId],
    queryFn: async () => {
      let q = supabase
        .from('escalations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (queue === 'unassigned') {
        q = q.is('assigned_to', null).not('status', 'in', '("RESOLVED","CLOSED")');
      } else if (queue === 'mine') {
        q = q.eq('assigned_to', userId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    refetchInterval: 30000,
  });
}

export function useEscalationById(ticketId: string | undefined) {
  return useQuery({
    queryKey: ['escalation', ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalations')
        .select('*')
        .eq('id', ticketId!)
        .single();
      if (error) throw error;
      return mapRow(data);
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
      assigned_to?: string | null;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      queryClient.invalidateQueries({ queryKey: ['escalation'] });
    },
  });
}
