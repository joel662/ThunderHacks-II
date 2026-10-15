import type { ReportStatus } from '@/types';

const STATUS_CONFIG: Record<ReportStatus, { label: string; bg: string; text: string }> = {
  open: { label: 'Open', bg: 'bg-red-500/20', text: 'text-red-400' },
  in_progress: { label: 'In Progress', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  resolved: { label: 'Resolved', bg: 'bg-green-500/20', text: 'text-green-400' },
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
