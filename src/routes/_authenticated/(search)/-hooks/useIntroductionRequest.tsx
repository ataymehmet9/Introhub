import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { Button, Notification, toast } from '@/components/ui'
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
      // Check if user is approaching limit after successful request
      const updatedPlanDetails = await queryClient.fetchQuery({
        ...trpc.billing.getPlanDetails.queryOptions(),
      })

      const requestsRemaining =
        updatedPlanDetails.requestsLimit !== null
          ? updatedPlanDetails.requestsLimit - updatedPlanDetails.requestsUsed
          : null

      // Show success toast
      toast.push(
        <Notification type="success" title="Request sent">
          Your introduction request has been sent successfully
        </Notification>,
      )

      // Show warning toast if user has 1 or fewer requests remaining
      if (
        requestsRemaining !== null &&
        requestsRemaining <= 1 &&
        updatedPlanDetails.planType === 'free'
      ) {
        setTimeout(() => {
          toast.push(
            <Notification
              type="warning"
              title="Running low on requests"
              duration={8000}
            >
              <div className="space-y-2">
                <p>
                  You have {requestsRemaining} request
                  {requestsRemaining !== 1 ? 's' : ''} remaining this month.
                </p>
                <Link to="/me/billing">
                  <Button size="sm" variant="solid" className="mt-2">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </Notification>,
            { placement: 'top-end' },
          )
        }, 1500)
      }
      // Invalidate billing queries to update plan details in header
      await queryClient.invalidateQueries({
        predicate: (query) => {
          return (
            Array.isArray(query.queryKey) &&
            query.queryKey[0]?.[0] === 'billing'
          )
        },
      })

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
