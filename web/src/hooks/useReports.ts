import { useEffect, useState } from 'react';
import { subscribeToReports } from '@/services/reports';
import { isDemoMode } from '@/lib/demo';
import { MOCK_REPORTS } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import type { Report, FilterState } from '@/types';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  categories: [],
  status: 'all',
  dateFrom: '',
  dateTo: '',
  minUpvotes: 0,
  sortBy: 'newest',
};

export function useReports() {
  const { user } = useAuth();
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    if (isDemoMode()) {
      setAllReports(MOCK_REPORTS);
      setLoading(false);
      return;
    }

    const unsub = subscribeToReports((reports) => {
      setAllReports(reports);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const toDate = (ts: any): Date => {
    if (ts instanceof Date) return ts;
    if (ts?.toDate) return ts.toDate();
    return new Date(ts);
  };

  const filtered = allReports.filter((r) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matches =
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location.address.toLowerCase().includes(q) ||
        r.authorName.toLowerCase().includes(q);
      if (!matches) return false;
    }

    if (filters.categories.length > 0 && !filters.categories.includes(r.category)) {
      return false;
    }

    if (filters.status !== 'all' && r.status !== filters.status) {
      return false;
    }

    if (filters.minUpvotes > 0 && r.upvoteCount < filters.minUpvotes) {
      return false;
    }

    if (filters.dateFrom) {
      const created = toDate(r.createdAt);
      if (created < new Date(filters.dateFrom)) return false;
    }

    if (filters.dateTo) {
      const created = toDate(r.createdAt);
      if (created > new Date(filters.dateTo + 'T23:59:59')) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest':
        return toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime();
      case 'oldest':
        return toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime();
      case 'most_upvoted':
        return b.upvoteCount - a.upvoteCount;
      case 'most_commented':
        return b.commentCount - a.commentCount;
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  return {
    reports: paginated,
    allFilteredReports: sorted,
    allReports,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    totalFiltered: sorted.length,
  };
}

export { DEFAULT_FILTERS };
