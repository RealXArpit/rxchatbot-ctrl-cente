import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  MetricsSnapshot, TrendPoint, FunnelStep, AlertEvent,
} from '@/lib/mock-metrics';

// ── KPI Snapshot ──────────────────────────────────────────────────────────────
export function useDashboardSnapshot() {
  return useQuery({
    queryKey: ['dashboard_snapshot'],
    queryFn: async (): Promise<MetricsSnapshot> => {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('routed_to, cache_hit, confidence, escalation_reason, timestamp');
      if (error) throw error;
      const rows = data ?? [];
      const total = rows.length;

      const botResolved   = rows.filter(r => r.routed_to === 'BOT').length;
      const cacheHits     = rows.filter(r => r.cache_hit === true).length;
      const escalated     = rows.filter(r => r.escalation_reason && r.escalation_reason !== '').length;

      const containment   = total > 0 ? botResolved / total : 0;
      const cacheRate     = total > 0 ? cacheHits / total : 0;
      const escalationRate = total > 0 ? escalated / total : 0;

      // Confidence bands
      const highConf   = rows.filter(r => (r.confidence ?? 0) >= 0.72).length;
      const medConf    = rows.filter(r => (r.confidence ?? 0) >= 0.55 && (r.confidence ?? 0) < 0.72).length;
      const lowConf    = rows.filter(r => (r.confidence ?? 0) < 0.55).length;
      const confTotal  = rows.length || 1;

      return {
        tenantId: 'realx',
        env: 'prod',
        range: 'all',
        generatedAt: new Date().toISOString(),
        kpis: {
          totalConversations: total,
          containmentRate:    Math.round(containment * 100) / 100,
          cacheHitRate:       Math.round(cacheRate * 100) / 100,
          escalationRate:     Math.round(escalationRate * 100) / 100,
          p0SlaFirstResponse: 1,
          p1SlaFirstResponse: 1,
          p2SlaFirstResponse: 1,
        },
        confidenceBands: {
          high:   Math.round((highConf / confTotal) * 100) / 100,
          medium: Math.round((medConf  / confTotal) * 100) / 100,
          low:    Math.round((lowConf  / confTotal) * 100) / 100,
        },
      };
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

// ── 7-day Trend ───────────────────────────────────────────────────────────────
export function useDashboardTrend() {
  return useQuery({
    queryKey: ['dashboard_trend'],
    queryFn: async (): Promise<TrendPoint[]> => {
      const since = new Date();
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('chat_logs')
        .select('routed_to, escalation_reason, timestamp')
        .gte('timestamp', since.toISOString())
        .order('timestamp', { ascending: true });
      if (error) throw error;
      const rows = data ?? [];

      const byDate: Record<string, { total: number; bot: number; escalated: number }> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(since);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        byDate[key] = { total: 0, bot: 0, escalated: 0 };
      }

      for (const row of rows) {
        const key = (row.timestamp ?? '').slice(0, 10);
        if (!byDate[key]) continue;
        byDate[key].total++;
        if (row.routed_to === 'BOT') byDate[key].bot++;
        if (row.escalation_reason && row.escalation_reason !== '') byDate[key].escalated++;
      }

      return Object.entries(byDate).map(([date, d]): TrendPoint => ({
        date,
        conversations: d.total,
        containment:   d.total > 0 ? Math.round((d.bot / d.total) * 100) / 100 : 0,
        escalation:    d.total > 0 ? Math.round((d.escalated / d.total) * 100) / 100 : 0,
      }));
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

// ── Funnel ────────────────────────────────────────────────────────────────────
export function useDashboardFunnel() {
  return useQuery({
    queryKey: ['dashboard_funnel'],
    queryFn: async (): Promise<FunnelStep[]> => {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('routed_to, escalation_reason, cache_hit');
      if (error) throw error;
      const rows = data ?? [];

      const total      = rows.length;
      const botResolved = rows.filter(r => r.routed_to === 'BOT' && !r.escalation_reason).length;
      const escalated  = rows.filter(r => r.escalation_reason && r.escalation_reason !== '').length;
      const cacheHits  = rows.filter(r => r.cache_hit === true).length;
      const dropped    = Math.max(0, total - botResolved - escalated - cacheHits);

      return [
        { label: 'Total Conversations', value: total,      color: 'hsl(var(--primary))' },
        { label: 'Cache Hit (instant)', value: cacheHits,  color: 'hsl(var(--primary) / 0.5)' },
        { label: 'Bot Resolved',        value: botResolved, color: 'hsl(var(--success))' },
        { label: 'Escalated',           value: escalated,  color: 'hsl(var(--warning))' },
        { label: 'Dropped / Other',     value: dropped,    color: 'hsl(var(--destructive))' },
      ];
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

// ── Daily Summary ─────────────────────────────────────────────────────────────
export function useDailyMetrics() {
  return useQuery({
    queryKey: ['dashboard_daily'],
    queryFn: async (): Promise<{ label: string; value: string }[]> => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('chat_logs')
        .select('routed_to, cache_hit, escalation_reason')
        .gte('timestamp', todayStart.toISOString());
      if (error) throw error;
      const rows = data ?? [];

      const total     = rows.length;
      const botCount  = rows.filter(r => r.routed_to === 'BOT').length;
      const escalated = rows.filter(r => r.escalation_reason && r.escalation_reason !== '').length;
      const cacheHits = rows.filter(r => r.cache_hit === true).length;
      const containment = total > 0 ? Math.round((botCount / total) * 100) : 0;

      return [
        { label: 'Conversations today', value: String(total) },
        { label: 'Avg containment',     value: `${containment}%` },
        { label: 'Open escalations',    value: String(escalated) },
        { label: 'Cache hits today',    value: String(cacheHits) },
      ];
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

// ── Active Alerts ─────────────────────────────────────────────────────────────
export function useDashboardAlerts() {
  return useQuery({
    queryKey: ['dashboard_alerts'],
    queryFn: async (): Promise<AlertEvent[]> => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('chat_logs')
        .select('confidence, escalation_reason, timestamp')
        .gte('timestamp', twoHoursAgo);
      if (error) throw error;
      const rows = data ?? [];

      const alerts: AlertEvent[] = [];
      const now = new Date().toISOString();

      const lowConfCount = rows.filter(r => (r.confidence ?? 0) < 0.55).length;
      if (lowConfCount >= 5) {
        alerts.push({
          id: 'auto_low_conf',
          severity: lowConfCount >= 10 ? 'critical' : 'warning',
          type: 'LOW_CONFIDENCE',
          message: `${lowConfCount} conversations with low confidence in the last 2 hours`,
          createdAt: now,
        });
      }

      const escalatedCount = rows.filter(r => r.escalation_reason && r.escalation_reason !== '').length;
      if (escalatedCount >= 3) {
        alerts.push({
          id: 'auto_escalation_spike',
          severity: 'warning',
          type: 'ESCALATION_SPIKE',
          message: `${escalatedCount} escalations triggered in the last 2 hours`,
          createdAt: now,
        });
      }

      return alerts;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
