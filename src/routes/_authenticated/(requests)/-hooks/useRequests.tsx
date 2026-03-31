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
  initialData?: unknown
}

export function useRequests(options: UseRequestsOptions = {}) {
  const {
    enabled = true,
    onAcceptSuccess,
    onRejectSuccess,
    onDeleteSuccess,
    filterType = 'all',
    page = 1,
    pageSize = 10,
    initialData,
  } = options

  const { selectedRequests, setSelectedRequest, setSelectAllRequests } =
    useRequestStore((state) => state)

  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const queryKey = trpc.introductionRequests.listByUser.queryKey({
    page,
    pageSize,
    filterType,
  })

  // Fetch requests with pagination - now with server-side filtering and SSR support
  const { data, isFetching: isLoading } = useQuery({
    ...trpc.introductionRequests.listByUser.queryOptions({
      page,
      pageSize,
      filterType,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData: initialData as any,
    enabled,
    refetchOnWindowFocus: true, // Refetch when user returns to the page
    staleTime: 1000 * 30, // Cache for 30 seconds - balance between freshness and performance
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes when not in use
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
      // Invalidate dashboard queries to reflect the status change
      await queryClient.invalidateQueries({
        predicate: (query) => {
          return (
            Array.isArray(query.queryKey) &&
            query.queryKey[0]?.[0] === 'dashboard'
          )
        },
      })
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
      // Invalidate dashboard queries to reflect the status change
      await queryClient.invalidateQueries({
        predicate: (query) => {
          return (
            Array.isArray(query.queryKey) &&
            query.queryKey[0]?.[0] === 'dashboard'
          )
        },
      })
    },
  })

  // Soft delete request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: (id: number) =>
      trpcClient.introductionRequests.softDelete.mutate({ id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })

      const previousRequests = queryClient.getQueryData(queryKey)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
      // Invalidate dashboard queries to reflect the deletion
      await queryClient.invalidateQueries({
        predicate: (query) => {
          return (
            Array.isArray(query.queryKey) &&
            query.queryKey[0]?.[0] === 'dashboard'
          )
        },
      })
    },
  })

  // Server now handles filtering, so we can use the data directly
  // Data can be undefined during refetch when switching tabs
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const requests = data?.data ?? []
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const pagination = data?.pagination
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const requestsTotal = pagination?.total ?? 0

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
