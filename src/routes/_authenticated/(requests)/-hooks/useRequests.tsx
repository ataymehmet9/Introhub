import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRequestStore } from '../-store/requestStore'
import type { IntroductionRequestWithDetails } from '../-store/requestStore'
import { useTRPC } from '@/integrations/trpc/react'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { Notification, toast } from '@/components/ui'

interface UseRequestsOptions {
  enabled?: boolean
  onAcceptSuccess?: () => void
  onRejectSuccess?: () => void
  onDeleteSuccess?: () => void
  filterType?: 'sent' | 'received' | 'all'
  currentUserId?: string
  page?: number
  pageSize?: number
}

export function useRequests(options: UseRequestsOptions = {}) {
  const {
    enabled = true,
    onAcceptSuccess,
    onRejectSuccess,
    onDeleteSuccess,
    filterType = 'all',
    currentUserId,
    page = 1,
    pageSize = 10,
  } = options

  const { selectedRequests, setSelectedRequest, setSelectAllRequests } =
    useRequestStore((state) => state)

  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const queryKey = trpc.introductionRequests.listByUser.queryKey({
    page,
    pageSize,
  })

  // Fetch requests with pagination
  const { data, isFetching: isLoading } = useQuery({
    ...trpc.introductionRequests.listByUser.queryOptions({ page, pageSize }),
    enabled,
  })

  // Accept request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: ({
      id,
      customMessage,
    }: {
      id: number
      customMessage: string
    }) =>
      trpcClient.introductionRequests.updateStatus.mutate({
        id,
        data: {
          status: 'approved',
          responseMessage: customMessage,
        },
      }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey })

      const previousRequests = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !old.data) return old
        return {
          ...old,
          data: old.data.map((request: IntroductionRequestWithDetails) =>
            request.id === id
              ? { ...request, status: 'approved' as const }
              : request,
          ),
        }
      })

      return { previousRequests }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(queryKey, context.previousRequests)
      }
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to accept request'}
        </Notification>,
      )
    },
    onSuccess: () => {
      toast.push(
        <Notification type="success" title="Request accepted">
          Introduction email has been sent to both parties
        </Notification>,
      )
      onAcceptSuccess?.()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: ({
      id,
      customMessage,
    }: {
      id: number
      customMessage: string
    }) =>
      trpcClient.introductionRequests.updateStatus.mutate({
        id,
        data: {
          status: 'declined',
          responseMessage: customMessage,
        },
      }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey })

      const previousRequests = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !old.data) return old
        return {
          ...old,
          data: old.data.map((request: IntroductionRequestWithDetails) =>
            request.id === id
              ? { ...request, status: 'declined' as const }
              : request,
          ),
        }
      })

      return { previousRequests }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(queryKey, context.previousRequests as any)
      }
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to reject request'}
        </Notification>,
      )
    },
    onSuccess: () => {
      toast.push(
        <Notification type="success" title="Request rejected">
          Rejection email has been sent to the requester
        </Notification>,
      )
      onRejectSuccess?.()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Soft delete request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: (id: number) =>
      trpcClient.introductionRequests.softDelete.mutate({ id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })

      const previousRequests = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !old.data) return old
        return {
          ...old,
          data: old.data.filter(
            (request: IntroductionRequestWithDetails) => request.id !== id,
          ),
        }
      })

      return { previousRequests }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(queryKey, context.previousRequests as any)
      }
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to delete request'}
        </Notification>,
      )
    },
    onSuccess: () => {
      toast.push(
        <Notification type="success" title="Request deleted">
          Request has been successfully deleted
        </Notification>,
      )
      onDeleteSuccess?.()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const allRequests = data?.data ?? []
  const pagination = data?.pagination

  // Filter requests based on filterType (client-side filtering for tab switching)
  const requests = allRequests.filter((request) => {
    if (filterType === 'all') return true
    if (!currentUserId) return true

    if (filterType === 'sent') {
      return request.requesterId === currentUserId
    } else if (filterType === 'received') {
      return request.approverId === currentUserId
    }

    return true
  })

  // Use server-provided total, or fallback to filtered count
  const requestsTotal = pagination?.total ?? requests.length

  return {
    requests,
    requestsTotal,
    isLoading,
    selectedRequests,
    setSelectedRequest,
    setSelectAllRequests,
    acceptRequest: acceptRequestMutation.mutateAsync,
    rejectRequest: rejectRequestMutation.mutateAsync,
    deleteRequest: deleteRequestMutation.mutateAsync,
    queryKey,
    queryClient,
  }
}
