import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { useRequests } from './-hooks/useRequests'
import RequestsTable from './-components/RequestsTable'
import AcceptRequestModal from './-components/AcceptRequestModal'
import RejectRequestModal from './-components/RejectRequestModal'
import type { IntroductionRequestWithDetails } from './-store/requestStore'
import { useSession } from '@/lib/auth-client'
import { Tabs } from '@/components/ui'
import { AdaptiveCard, Container } from '@/components/shared'
import { createServerCaller } from '@/integrations/trpc/server-context'

const requestsSearchSchema = z.object({
  tab: z.enum(['received', 'sent']).optional().default('received'),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(10),
})

// Server function to fetch requests data
const getRequestsData = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { tab: 'received' | 'sent'; page: number; pageSize: number }) =>
      data,
  )
  .handler(async ({ data }) => {
    const caller = await createServerCaller()

    const requests = await caller.introductionRequests.listByUser({
      page: data.page,
      pageSize: data.pageSize,
      filterType: data.tab,
    })

    return { requests }
  })

export const Route = createFileRoute('/_authenticated/(requests)/requests')({
  validateSearch: requestsSearchSchema,
  loader: async (opts) => {
    // Get validated search params
    const search = requestsSearchSchema.parse(opts.location.search)
    const { tab, page, pageSize } = search
    return await getRequestsData({ data: { tab, page, pageSize } })
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { tab, page, pageSize } = Route.useSearch()
  const { data: session } = useSession()
  const currentUserId = session?.user.id
  const loaderData = Route.useLoaderData()

  const [acceptingRequest, setAcceptingRequest] =
    useState<IntroductionRequestWithDetails | null>(null)
  const [rejectingRequest, setRejectingRequest] =
    useState<IntroductionRequestWithDetails | null>(null)

  // Only use initialData when search params match loader params (default: received, page 1, pageSize 10)
  const isDefaultParams = tab === 'received' && page === 1 && pageSize === 10

  // Use the custom hook for requests management
  const { acceptRequest, rejectRequest, requests, requestsTotal, isLoading } =
    useRequests({
      onAcceptSuccess: () => setAcceptingRequest(null),
      onRejectSuccess: () => setRejectingRequest(null),
      filterType: tab,
      currentUserId,
      page,
      pageSize,
      initialData: isDefaultParams ? loaderData.requests : undefined,
    })

  const handleAcceptRequest = async (customMessage: string) => {
    if (acceptingRequest) {
      await acceptRequest({
        id: acceptingRequest.id,
        customMessage,
      })
    }
  }

  const handleRejectRequest = async (customMessage: string) => {
    if (rejectingRequest) {
      await rejectRequest({
        id: rejectingRequest.id,
        customMessage,
      })
    }
  }

  const handleTabChange = (value: string) => {
    navigate({
      search: () => ({
        tab: value as 'received' | 'sent',
        page: 1, // Reset to page 1 when changing tabs
        pageSize,
      }),
    })
  }

  const handlePaginationChange = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    })
  }

  const handlePageSizeChange = (newPageSize: number) => {
    // Validate the page size is a valid number
    const validPageSize = Number(newPageSize)
    if (!validPageSize || isNaN(validPageSize) || validPageSize <= 0) {
      return
    }

    navigate({
      search: (prev) => ({
        ...prev,
        pageSize: validPageSize,
        page: 1, // Reset to page 1 when changing page size
      }),
    })
  }

  const isReceivedTab = tab === 'received'
  const showActions = isReceivedTab

  return (
    <>
      <Container>
        <AdaptiveCard>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h1>Introduction Requests</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {isReceivedTab
                    ? 'Manage introduction requests from your network'
                    : 'View introduction requests you have made'}
                </p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <Tabs value={tab} onChange={handleTabChange}>
              <Tabs.TabList>
                <Tabs.TabNav value="received">Requests Received</Tabs.TabNav>
                <Tabs.TabNav value="sent">Requests Made</Tabs.TabNav>
              </Tabs.TabList>
            </Tabs>

            <RequestsTable
              onSelectAcceptRequest={setAcceptingRequest}
              onSelectRejectRequest={setRejectingRequest}
              showActions={showActions}
              filterType={tab}
              requests={requests}
              isLoading={isLoading}
              pagingData={{
                total: requestsTotal,
                pageIndex: page,
                pageSize: pageSize,
              }}
              onPaginationChange={handlePaginationChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </AdaptiveCard>
      </Container>

      {/* Accept Request Modal */}
      <AcceptRequestModal
        isOpen={!!acceptingRequest}
        onClose={() => setAcceptingRequest(null)}
        request={acceptingRequest}
        onSubmit={handleAcceptRequest}
      />

      {/* Reject Request Modal */}
      <RejectRequestModal
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        request={rejectingRequest}
        onSubmit={handleRejectRequest}
      />
    </>
  )
}
