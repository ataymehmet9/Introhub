import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { Notification, toast } from '@/components/ui'
import { useTRPC } from '@/integrations/trpc/react'

interface CreateIntroductionRequestInput {
  targetContactId: number
  message: string
}

interface UseIntroductionRequestOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  onLimitReached?: () => void
}

export function useIntroductionRequest(
  options: UseIntroductionRequestOptions = {},
) {
  const { onSuccess, onError, onLimitReached } = options
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const [showLimitModal, setShowLimitModal] = useState(false)

  // Fetch plan details to show in limit modal
  const { data: planDetails } = useQuery({
    ...trpc.billing.getPlanDetails.queryOptions(),
  })

  // Create introduction request mutation
  const createRequestMutation = useMutation({
    mutationFn: (data: CreateIntroductionRequestInput) =>
      trpcClient.introductionRequests.create.mutate(data),
    onSuccess: async () => {
      toast.push(
        <Notification type="success" title="Request sent">
          Your introduction request has been sent successfully
        </Notification>,
      )
      // Invalidate all search queries to update hasPendingRequest status
      // This will refetch any active search queries with the updated data
      await queryClient.invalidateQueries({
        predicate: (query) => {
          // Match any query that starts with the tRPC search procedure path
          return (
            Array.isArray(query.queryKey) &&
            query.queryKey[0]?.[0] === 'search' &&
            query.queryKey[0]?.[1] === 'globalSearch'
          )
        },
      })

      // Invalidate dashboard queries to reflect the new request
      await queryClient.invalidateQueries({
        predicate: (query) => {
          return (
            Array.isArray(query.queryKey) &&
            query.queryKey[0]?.[0] === 'dashboard'
          )
        },
      })

      onSuccess?.()
    },
    onError: (error: Error) => {
      // Check if error is due to limit reached
      if (
        error.message.includes('limit') ||
        error.message.includes('exceeded')
      ) {
        setShowLimitModal(true)
        onLimitReached?.()
      } else {
        toast.push(
          <Notification type="danger" title="Error">
            {error.message || 'Failed to send introduction request'}
          </Notification>,
        )
        onError?.(error)
      }
    },
  })

  return {
    createRequest: createRequestMutation.mutateAsync,
    isCreating: createRequestMutation.isPending,
    showLimitModal,
    setShowLimitModal,
    planDetails,
  }
}
