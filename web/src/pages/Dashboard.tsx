import { useState } from 'react';
import { LogOut, BarChart3, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useReports } from '@/hooks/useReports';
import { useStats } from '@/hooks/useStats';
import { StatsCards } from '@/components/StatsCards';
import { Filters } from '@/components/Filters';
import { MapView } from '@/components/MapView';
import { ReportTable } from '@/components/ReportTable';
import { CategoryChart } from '@/components/CategoryChart';

export function Dashboard() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const {
    reports,
    allFilteredReports,
    allReports,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    totalFiltered,
  } = useReports();
  const stats = useStats(allReports);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-[var(--border)] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
            <span className="text-accent font-bold text-sm">3</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">311.2Brampton</h1>
            <p className="text-xs text-muted">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted hover:text-themed hover:bg-hover transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowChart(!showChart)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showChart ? 'bg-accent/20 text-accent' : 'text-muted hover:text-themed'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <span className="text-sm text-muted">{user?.displayName || user?.email}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-themed transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-4 overflow-hidden flex flex-col">
        {/* Stats */}
        <StatsCards
          total={stats.total}
          open={stats.open}
          resolved={stats.resolved}
          thisWeek={stats.thisWeek}
          loading={loading}
        />

        {/* Analytics panel */}
        {showChart && (
          <div className="bg-card border border-[var(--border)] rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted mb-3">Reports by Category</h3>
            <div className="h-[200px]">
              <CategoryChart breakdown={stats.categoryBreakdown} />
            </div>
          </div>
        )}

        {/* Filters */}
        <Filters filters={filters} onChange={setFilters} reports={allFilteredReports} />

        {/* Map + Table split */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Map */}
          <div className="w-[60%] bg-card border border-[var(--border)] rounded-xl overflow-hidden">
            <MapView
              reports={allFilteredReports}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          {/* Table */}
          <div className="w-[40%] bg-card border border-[var(--border)] rounded-xl overflow-hidden">
            <ReportTable
              reports={reports}
              selectedId={selectedId}
              onSelect={setSelectedId}
              page={page}
              totalPages={totalPages}
              totalFiltered={totalFiltered}
              onPageChange={setPage}
              sortBy={filters.sortBy}
              onSortChange={(sortBy) => setFilters({ ...filters, sortBy })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
