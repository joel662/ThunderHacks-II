import { Search, RotateCcw, Download } from 'lucide-react';
import {
  CATEGORY_LABELS,
  type FilterState,
  type ReportCategory,
  type Report,
} from '@/types';
import { DEFAULT_FILTERS } from '@/hooks/useReports';

interface FiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  reports: Report[];
}

function exportCSV(reports: Report[]) {
  const headers = ['Title', 'Category', 'Status', 'Address', 'Upvotes', 'Comments', 'Author', 'Date'];
  const rows = reports.map((r) => [
    `"${r.title.replace(/"/g, '""')}"`,
    CATEGORY_LABELS[r.category],
    r.status,
    `"${r.location.address.replace(/"/g, '""')}"`,
    r.upvoteCount,
    r.commentCount,
    r.authorName,
    (r.createdAt?.toDate?.() || new Date(r.createdAt))?.toISOString?.() || '',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `311-2-brampton-reports-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Filters({ filters, onChange, reports }: FiltersProps) {
  const update = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const toggleCategory = (cat: ReportCategory) => {
    const cats = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    update({ categories: cats });
  };

  return (
    <div className="bg-card border border-[var(--border)] rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search reports..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full bg-surface border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-sm text-themed focus:outline-none focus:border-accent"
          />
        </div>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => update({ status: e.target.value as FilterState['status'] })}
          className="bg-surface border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-themed focus:outline-none focus:border-accent"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value as FilterState['sortBy'] })}
          className="bg-surface border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-themed focus:outline-none focus:border-accent"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="most_upvoted">Most Upvoted</option>
          <option value="most_commented">Most Commented</option>
        </select>

        {/* Min Upvotes */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted whitespace-nowrap">Min Upvotes:</label>
          <input
            type="number"
            min={0}
            value={filters.minUpvotes}
            onChange={(e) => update({ minUpvotes: parseInt(e.target.value) || 0 })}
            className="w-20 bg-surface border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-themed focus:outline-none focus:border-accent"
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            className="bg-surface border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-themed focus:outline-none focus:border-accent"
          />
          <span className="text-muted text-xs">to</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            className="bg-surface border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-themed focus:outline-none focus:border-accent"
          />
        </div>

        {/* Actions */}
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted hover:text-themed transition-colors"
          title="Reset filters"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        <button
          onClick={() => exportCSV(reports)}
          className="flex items-center gap-1.5 bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(CATEGORY_LABELS) as [ReportCategory, string][]).map(([key, label]) => {
          const active = filters.categories.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                active
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-surface border-[var(--border)] text-muted hover:text-themed hover:border-accent/30'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
