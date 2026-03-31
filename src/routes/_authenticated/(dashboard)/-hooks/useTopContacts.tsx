import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '../-store/dashboardStore'
import { useTRPC } from '@/integrations/trpc/react'

/**
 * Hook to fetch top contacts by request count with caching
 * - SSR support via initialData parameter
 */
export function useTopContacts(limit: number = 10, initialData?: unknown) {
  const { dateRange, granularity } = useDashboardStore()
  const trpc = useTRPC()

  return useQuery({
    ...trpc.dashboard.getTopContacts.queryOptions({
      startDate: dateRange.start,
      endDate: dateRange.end,
      granularity: granularity ?? undefined,
      limit,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData: initialData as any,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    placeholderData: (previousData: any) => previousData,
  })
}
