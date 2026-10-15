import { useMemo } from 'react';
import { getReportStats } from '@/services/reports';
import type { Report } from '@/types';

export function useStats(reports: Report[]) {
  return useMemo(() => getReportStats(reports), [reports]);
}
