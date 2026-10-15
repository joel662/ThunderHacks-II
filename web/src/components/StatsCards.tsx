import { FileText, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  total: number;
  open: number;
  resolved: number;
  thisWeek: number;
  loading: boolean;
}

export function StatsCards({ total, open, resolved, thisWeek, loading }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Reports',
      value: total,
      icon: FileText,
      gradient: 'from-blue-600/20 to-blue-800/5',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Open Issues',
      value: open,
      icon: AlertCircle,
      gradient: 'from-red-600/20 to-red-800/5',
      iconColor: 'text-red-400',
    },
    {
      label: 'Resolved',
      value: resolved,
      icon: CheckCircle2,
      gradient: 'from-green-600/20 to-green-800/5',
      iconColor: 'text-green-400',
    },
    {
      label: 'This Week',
      value: thisWeek,
      icon: TrendingUp,
      gradient: 'from-purple-600/20 to-purple-800/5',
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gradient-to-br ${card.gradient} border border-[var(--border)] rounded-xl p-5`}
        >
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-8 w-16" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted">{card.label}</span>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
