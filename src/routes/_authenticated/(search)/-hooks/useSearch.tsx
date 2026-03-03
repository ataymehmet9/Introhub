import { useQuery } from '@tanstack/react-query'
import type { SearchField } from '@/schemas'
import { useTRPC } from '@/integrations/trpc/react'

interface UseSearchOptions {
  query: string
  fields?: Array<SearchField>
  page?: number
  pageSize?: number
  enabled?: boolean
}

export function useSearch(options: UseSearchOptions) {
  const {
    query,
    fields = ['name', 'company', 'position'],
    page = 1,
    pageSize = 25,
    enabled = true,
  } = options

  const trpc = useTRPC()

  const queryKey = trpc.search.globalSearch.queryKey({
    query,
    fields,
    page,
    pageSize,
  })

  // Only fetch if enabled and query is at least 2 characters
  const shouldFetch = enabled && query.length >= 2

  const {
    data,
    isFetching: isLoading,
    error,
  } = useQuery({
    ...trpc.search.globalSearch.queryOptions({
      query,
      fields,
      page,
      pageSize,
    }),
    enabled: shouldFetch,
  })

  const searchResults = data?.data ?? []
  const total = data?.total ?? 0

  return {
    // Data
    results: searchResults,
    total,
    isLoading,
    error,

    // Query utilities
    queryKey,
  }
}
