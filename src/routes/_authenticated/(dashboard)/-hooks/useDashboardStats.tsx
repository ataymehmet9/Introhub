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
 * - SSR support via initialData parameter
 */
export function useDashboardStats(initialData?: unknown) {
  const { dateRange, granularity } = useDashboardStore()
  const trpc = useTRPC()

  return useQuery({
    ...trpc.dashboard.getStats.queryOptions({
      startDate: dateRange.start,
      endDate: dateRange.end,
      granularity: granularity ?? undefined,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData: initialData as any,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    // Keep previous data while fetching new data for smooth transitions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    placeholderData: (previousData: any) => previousData,
  })
}
