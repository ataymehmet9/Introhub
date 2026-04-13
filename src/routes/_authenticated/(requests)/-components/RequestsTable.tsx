import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TbCheck, TbTrash, TbX } from 'react-icons/tb'
import { useRequestStore } from '../-store/requestStore'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'
import type { IntroductionRequestWithDetails } from '../-store/requestStore'
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  Notification,
  Tooltip,
  toast,
} from '@/components/ui'
import { stringToColor } from '@/utils/colours'
import DataTable from '@/components/shared/DataTable'
import { DateFormat } from '@/components/shared/common'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useTRPC } from '@/integrations/trpc/react'

type RequestsTableProps = {
  onSelectAcceptRequest: (request: IntroductionRequestWithDetails) => void
  onSelectRejectRequest: (request: IntroductionRequestWithDetails) => void
  showActions?: boolean
  filterType?: 'sent' | 'received' | 'all'
  requests: Array<IntroductionRequestWithDetails>
  isLoading: boolean
  pagingData: {
    total: number
    pageIndex: number
    pageSize: number
  }
  onPaginationChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const RequesterColumn = ({
  row,
  filterType,
}: {
  row: IntroductionRequestWithDetails
  filterType?: 'sent' | 'received' | 'all'
}) => {
  // For "Requests Made" (sent), show the approver (recipient)
  // For "Requests Received" (received), show the requester
  const displayName =
    filterType === 'sent' ? row.approverName : row.requesterName
  const displayCompany =
    filterType === 'sent' ? row.approverCompany : row.requesterCompany
  const avatarColor = stringToColor(displayName)

  return (
    <div className="flex items-center gap-3">
      <Avatar
        size={40}
        shape="circle"
        style={{ backgroundColor: avatarColor }}
        className="text-white font-semibold flex-shrink-0 p-4"
      >
        {displayName.charAt(0) || 'U'}
      </Avatar>
      <div>
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {displayName}
        </div>
        {displayCompany && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {displayCompany}
          </div>
        )}
      </div>
    </div>
  )
}

const ContactColumn = ({ row }: { row: IntroductionRequestWithDetails }) => {
  return (
    <div>
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {row.targetContactName}
      </div>
      {row.targetContactCompany && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {row.targetContactCompany}
        </div>
      )}
    </div>
  )
}

const StatusColumn = ({ status }: { status: string }) => {
  const statusConfig = {
    pending: { color: 'bg-gray-300 text-gray-800', label: 'Pending' },
    approved: { color: 'bg-success-subtle text-success', label: 'Approved' },
    declined: { color: 'bg-error-subtle text-error', label: 'Declined' },
  }

  const config = statusConfig[status as keyof typeof statusConfig]

  return <Badge className={config.color} content={config.label} />
}

const ActionColumn = ({
  row,
  onAccept,
  onReject,
  onDelete,
}: {
  row: IntroductionRequestWithDetails
  onAccept: () => void
  onReject: () => void
  onDelete: () => void
}) => {
  // Only show accept/reject for pending requests
  if (row.status === 'pending') {
    return (
      <div className="flex items-center gap-3">
        <Tooltip title="Accept">
          <div
            className="text-xl cursor-pointer select-none font-semibold text-success hover:opacity-80"
            role="button"
            onClick={onAccept}
          >
            <TbCheck />
          </div>
        </Tooltip>
        <Tooltip title="Reject">
          <div
            className="text-xl cursor-pointer select-none font-semibold text-error hover:opacity-80"
            role="button"
            onClick={onReject}
          >
            <TbX />
          </div>
        </Tooltip>
        <Tooltip title="Delete">
          <div
            className="text-xl cursor-pointer select-none font-semibold text-gray-600 hover:text-gray-700"
            role="button"
            onClick={onDelete}
          >
            <TbTrash />
          </div>
        </Tooltip>
      </div>
    )
  }

  // For processed requests
  return null
}

const RequestsTable = ({
  onSelectAcceptRequest,
  onSelectRejectRequest,
  showActions = true,
  filterType = 'all',
  requests,
  isLoading,
  pagingData,
  onPaginationChange,
  onPageSizeChange,
}: RequestsTableProps) => {
  const [deletingRequest, setDeletingRequest] =
    useState<IntroductionRequestWithDetails | null>(null)

  const { sortConfig, setSortConfig } = useRequestStore()

  const queryClient = useQueryClient()
  const trpc = useTRPC()

  // Sort requests on the client side
  const sortedRequests = useMemo(() => {
    if (!sortConfig.key || !sortConfig.order) {
      return requests
    }

    const sorted = [...requests].sort((a, b) => {
      let aValue: string | number | Date | null | undefined
      let bValue: string | number | Date | null | undefined

      // Handle the dynamic requester/recipient column
      if (sortConfig.key === 'requesterName') {
        if (filterType === 'sent') {
          aValue = a.approverName
          bValue = b.approverName
        } else {
          aValue = a.requesterName
          bValue = b.requesterName
        }
      } else {
        aValue = a[sortConfig.key as keyof IntroductionRequestWithDetails]
        bValue = b[sortConfig.key as keyof IntroductionRequestWithDetails]
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.order === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }

      // Handle strings and numbers
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.order === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return sorted
  }, [requests, sortConfig, filterType])

  // Delete request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: (id: number) =>
      trpcClient.introductionRequests.softDelete.mutate({ id }),
    onSuccess: () => {
      toast.push(
        <Notification type="success" title="Request deleted">
          Request has been successfully deleted
        </Notification>,
      )
      setDeletingRequest(null)
      // Invalidate queries to refetch
      queryClient.invalidateQueries({
        queryKey: trpc.introductionRequests.listByUser.queryKey({
          page: pagingData.pageIndex,
          pageSize: pagingData.pageSize,
        }),
      })
    },
    onError: (error: Error) => {
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to delete request'}
        </Notification>,
      )
    },
  })

  const columns: Array<ColumnDef<IntroductionRequestWithDetails>> = useMemo(
    () => {
      const baseColumns: Array<ColumnDef<IntroductionRequestWithDetails>> = [
        {
          header: filterType === 'sent' ? 'Recipient' : 'Requester',
          accessorKey: 'requesterName',
          cell: (props: {
            row: { original: IntroductionRequestWithDetails }
          }) => {
            const row = props.row.original
            return <RequesterColumn row={row} filterType={filterType} />
          },
        },
        {
          header: 'Contact',
          accessorKey: 'targetContactName',
          cell: (props: {
            row: { original: IntroductionRequestWithDetails }
          }) => {
            const row = props.row.original
            return <ContactColumn row={row} />
          },
        },
        {
          header: 'Status',
          accessorKey: 'status',
          cell: (props: {
            row: { original: IntroductionRequestWithDetails }
          }) => <StatusColumn status={props.row.original.status} />,
        },
        {
          header: 'Requested',
          accessorKey: 'createdAt',
          cell: (props: {
            row: { original: IntroductionRequestWithDetails }
          }) => (
            <DateFormat date={props.row.original.createdAt} format="short" />
          ),
        },
      ]

      if (showActions) {
        baseColumns.push({
          header: '',
          id: 'action',
          cell: (props: {
            row: { original: IntroductionRequestWithDetails }
          }) => (
            <ActionColumn
              row={props.row.original}
              onAccept={() => onSelectAcceptRequest(props.row.original)}
              onReject={() => onSelectRejectRequest(props.row.original)}
              onDelete={() => setDeletingRequest(props.row.original)}
            />
          ),
        })
      }

      return baseColumns
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showActions, filterType],
  )

  const handleSort = (sort: OnSortParam) => {
    setSortConfig(String(sort.key), sort.order)
  }

  const handleDeletingDialogClose = () => {
    setDeletingRequest(null)
  }

  const handleDeleteRequestConfirm = async () => {
    if (deletingRequest) {
      await deleteRequestMutation.mutateAsync(deletingRequest.id)
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={sortedRequests}
        noData={!isLoading && sortedRequests.length === 0}
        skeletonAvatarColumns={[0]}
        skeletonAvatarProps={{ width: 28, height: 28 }}
        loading={isLoading}
        onSort={handleSort}
        pagingData={pagingData}
        onPaginationChange={onPaginationChange}
        onSelectChange={onPageSizeChange}
      />
      <Dialog
        isOpen={!!deletingRequest}
        onClose={handleDeletingDialogClose}
        onRequestClose={handleDeletingDialogClose}
      >
        <h5 className="mb-4">Delete Request?</h5>
        <p>
          Are you sure you want to delete the request from{' '}
          <strong>{deletingRequest?.requesterName}</strong> to connect with{' '}
          <strong>{deletingRequest?.targetContactName}</strong>?
        </p>
        <div className="text-right mt-6">
          <Button
            className="ltr:mr-2 rtl:ml-2"
            variant="plain"
            onClick={handleDeletingDialogClose}
          >
            Cancel
          </Button>
          <Button variant="solid" onClick={handleDeleteRequestConfirm}>
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  )
}

export default RequestsTable
