import type { EscalationTicket } from "@/lib/mock-escalations";

export type UrgencyLevel = "critical" | "attention" | "responding" | "resolved";

export interface UrgencyState {
  level: UrgencyLevel;
  elapsedMinutes: number;
  displayTime: string;
  label: string;
  rowClass: string;
  badgeClass: string;
  pulse: boolean;
}

// SLA breach thresholds in minutes
const SLA_BREACH: Record<string, number> = {
  P0: 120,   // 2 hours
  P1: 1440,  // 24 hours
  P2: 2880,  // 48 hours
};

function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getUrgency(ticket: EscalationTicket, now: Date = new Date()): UrgencyState {
  const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
  const isAssigned = !!ticket.assigneeId;
  const elapsedMinutes = (now.getTime() - new Date(ticket.escalatedAt).getTime()) / 60000;
  const slaBreachMinutes = SLA_BREACH[ticket.priority] ?? 1440;
  const minutesUntilBreach = slaBreachMinutes - elapsedMinutes;
  const displayTime = formatElapsed(elapsedMinutes);

  // RESOLVED / CLOSED — no urgency
  if (isResolved) {
    return {
      level: "resolved",
      elapsedMinutes,
      displayTime,
      label: "Resolved",
      rowClass: "opacity-50",
      badgeClass: "bg-muted text-muted-foreground border-muted",
      pulse: false,
    };
  }

  // CRITICAL: P0 unassigned at any time, OR any ticket breached > 1 hour ago
  const isCritical =
    (ticket.priority === "P0" && !isAssigned) ||
    elapsedMinutes > slaBreachMinutes + 60;

  if (isCritical) {
    return {
      level: "critical",
      elapsedMinutes,
      displayTime,
      label: `${displayTime} · ${ticket.priority} · ${isAssigned ? "Assigned" : "Unassigned"}`,
      rowClass: "bg-destructive/8 border-l-4 border-l-destructive",
      badgeClass: "bg-destructive text-destructive-foreground border-destructive animate-pulse",
      pulse: true,
    };
  }

  // ATTENTION: unassigned OR SLA breached OR within 30 min of breach
  const needsAttention =
    !isAssigned ||
    elapsedMinutes > slaBreachMinutes ||
    minutesUntilBreach < 30;

  if (needsAttention) {
    return {
      level: "attention",
      elapsedMinutes,
      displayTime,
      label: `${displayTime} · ${ticket.priority} · ${isAssigned ? "Assigned" : "Unassigned"}`,
      rowClass: "bg-warning/5 border-l-4 border-l-warning",
      badgeClass: "bg-warning/20 text-warning border-warning/50",
      pulse: false,
    };
  }

  // RESPONDING: assigned and within SLA
  return {
    level: "responding",
    elapsedMinutes,
    displayTime,
    label: `${displayTime} · ${ticket.priority} · Responding`,
    rowClass: "border-l-4 border-l-success/40",
    badgeClass: "bg-success/10 text-success border-success/30",
    pulse: false,
  };
}

// Sort tickets by urgency score — highest urgency first
export function sortByUrgency(tickets: EscalationTicket[]): EscalationTicket[] {
  const now = new Date();
  return [...tickets].sort((a, b) => {
    const ua = getUrgency(a, now);
    const ub = getUrgency(b, now);
    const levelOrder = { critical: 0, attention: 1, responding: 2, resolved: 3 };
    const levelDiff = levelOrder[ua.level] - levelOrder[ub.level];
    if (levelDiff !== 0) return levelDiff;
    // Within same level, sort by elapsed time descending (oldest first)
    return ub.elapsedMinutes - ua.elapsedMinutes;
  });
}
