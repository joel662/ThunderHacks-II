import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORY_LABELS, CATEGORY_COLORS, type ReportCategory } from '@/types';

interface CategoryChartProps {
  breakdown: Record<string, number>;
}

export function CategoryChart({ breakdown }: CategoryChartProps) {
  const { isDark } = useTheme();

  const data = Object.entries(breakdown)
    .map(([key, count]) => ({
      name: CATEGORY_LABELS[key as ReportCategory] || key,
      count,
      color: CATEGORY_COLORS[key as ReportCategory] || '#8b5cf6',
    }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        No data available
      </div>
    );
  }

  const axisColor = isDark ? '#888' : '#6b7280';
  const tooltipBg = isDark ? '#1a1a2e' : '#ffffff';
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const tooltipText = isDark ? '#eee' : '#1a1a2e';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: axisColor }}
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: tooltipText, fontWeight: 600 }}
          itemStyle={{ color: tooltipText }}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
