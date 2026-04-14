import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'

/**
 * Hook to fetch CRM integrations for the current user
 */
export function useCRMIntegrations() {
  const trpc = useTRPC()

  return useQuery({
    ...trpc.crm.list.queryOptions(),
  })
}

// Made with Bob
