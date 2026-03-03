import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '../-store/dashboardStore'
import { useTRPC } from '@/integrations/trpc/react'

/**
 * Hook to fetch dashboard statistics with caching
 *
 * Implements:
 * - 5 minute stale time for performance
 * - 10 minute garbage collection time
 * - No refetch on window focus (data doesn't change that frequently)
 */
export function useDashboardStats() {
  const { dateRange, granularity } = useDashboardStore()
  const trpc = useTRPC()

  return useQuery({
    ...trpc.dashboard.getStats.queryOptions({
      startDate: dateRange.start,
      endDate: dateRange.end,
      granularity: granularity ?? undefined,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    // Keep previous data while fetching new data for smooth transitions
    placeholderData: (previousData: any) => previousData,
  })
}
