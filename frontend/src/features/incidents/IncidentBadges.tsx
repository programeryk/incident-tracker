import type { IncidentPriority, IncidentStatus } from './types';

const statusClasses: Record<IncidentStatus, string> = {
  OPEN: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  IN_PROGRESS: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  RESOLVED: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
};

const priorityClasses: Record<IncidentPriority, string> = {
  LOW: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
  MEDIUM: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
  HIGH: 'border-orange-400/30 bg-orange-400/10 text-orange-200',
  CRITICAL: 'border-red-400/30 bg-red-400/10 text-red-200',
};

type StatusBadgeProps = {
  status: IncidentStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

type PriorityBadgeProps = {
  priority: IncidentPriority;
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${priorityClasses[priority]}`}
    >
      {priority}
    </span>
  );
}
