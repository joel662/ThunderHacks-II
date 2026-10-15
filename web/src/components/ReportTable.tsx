import { ArrowUpDown, ChevronLeft, ChevronRight, ThumbsUp, MessageSquare, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { CATEGORY_LABELS, CATEGORY_ICONS, type Report, type SortOption } from '@/types';

interface ReportTableProps {
  reports: Report[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  page: number;
  totalPages: number;
  totalFiltered: number;
  onPageChange: (page: number) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function ReportTable({
  reports,
  selectedId,
  onSelect,
  page,
  totalPages,
  totalFiltered,
  onPageChange,
  sortBy,
  onSortChange,
}: ReportTableProps) {
  const navigate = useNavigate();

  const formatDate = (ts: any) => {
    const d = ts?.toDate?.() || new Date(ts);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const cycleSortUpvotes = () => {
    onSortChange(sortBy === 'most_upvoted' ? 'newest' : 'most_upvoted');
  };

  const cycleSortComments = () => {
    onSortChange(sortBy === 'most_commented' ? 'newest' : 'most_commented');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-[var(--border)] text-left">
              <th className="px-3 py-3 text-muted font-medium">Report</th>
              <th className="px-3 py-3 text-muted font-medium">
                <button onClick={cycleSortUpvotes} className="flex items-center gap-1 hover:text-themed transition-colors">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-3 py-3 text-muted font-medium">
                <button onClick={cycleSortComments} className="flex items-center gap-1 hover:text-themed transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-3 py-3 text-muted font-medium">Status</th>
              <th className="px-3 py-3 text-muted font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-12 text-center text-muted">
                  No reports match your filters.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  onDoubleClick={() => navigate(`/reports/${r.id}`)}
                  className={`border-b border-[var(--border-subtle)] cursor-pointer transition-colors ${
                    selectedId === r.id
                      ? 'bg-accent/10 border-l-2 border-l-accent'
                      : 'hover:bg-hover'
                  }`}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg leading-none">{CATEGORY_ICONS[r.category]}</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[220px]">{r.title}</p>
                        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[200px]">{r.location.address}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1 text-orange-400 font-medium">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {r.upvoteCount}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted">{r.commentCount}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-3 text-muted text-xs whitespace-nowrap">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-2 bg-card">
          <span className="text-xs text-muted">
            {totalFiltered} result{totalFiltered !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 hover:bg-hover rounded disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 hover:bg-hover rounded disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
