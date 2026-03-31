import { useMemo } from 'react'
import { TbSend } from 'react-icons/tb'
import { useSearchStore } from '../-store/searchStore'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'
import type { SearchResult } from '@/schemas'
import { Avatar, Badge, Button, Tooltip } from '@/components/ui'
import { stringToColor } from '@/utils/colours'
import DataTable from '@/components/shared/DataTable'
import { DateFormat } from '@/components/shared/common'

type SearchResultsTableProps = {
  results: Array<SearchResult>
  isLoading: boolean
  onRequestIntroduction: (result: SearchResult) => void
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const NameColumn = ({ row }: { row: SearchResult }) => {
  const avatarColor = stringToColor(row.name)

  return (
    <div className="flex items-center gap-3">
      <Avatar
        size={40}
        shape="circle"
        style={{ backgroundColor: avatarColor }}
        className="text-white font-semibold flex-shrink-0 p-4"
      >
        {row.name.charAt(0) || 'U'}
      </Avatar>
      <div>
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {row.name}
        </div>
        {row.position && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.position}
          </div>
        )}
      </div>
    </div>
  )
}

const OwnerColumn = ({ row }: { row: SearchResult }) => {
  return (
    <div>
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {row.ownerName}
      </div>
      {row.ownerCompany && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {row.ownerCompany}
        </div>
      )}
    </div>
  )
}

const ActionColumn = ({
  row,
  onRequestIntroduction,
}: {
  row: SearchResult
  onRequestIntroduction: (result: SearchResult) => void
}) => {
  if (row.hasPendingRequest) {
    return (
      <Tooltip title="You have a pending request for this contact">
        <Badge className="bg-gray-300 text-gray-800" content="Pending" />
      </Tooltip>
    )
  }

  return (
    <Button
      size="sm"
      variant="solid"
      icon={<TbSend />}
      onClick={() => onRequestIntroduction(row)}
    >
      Request Introduction
    </Button>
  )
}

const SearchResultsTable = ({
  results,
  isLoading,
  onRequestIntroduction,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: SearchResultsTableProps) => {
  const { sortConfig, setSortConfig } = useSearchStore()

  // Sort results on the client side
  const sortedResults = useMemo(() => {
    if (!sortConfig.key || !sortConfig.order) {
      return results
    }

    const sorted = [...results].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof SearchResult]
      const bValue = b[sortConfig.key as keyof SearchResult]

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
  }, [results, sortConfig])

  const handleSort = (sort: OnSortParam) => {
    setSortConfig(String(sort.key), sort.order)
  }

  const columns: Array<ColumnDef<SearchResult>> = useMemo(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
        cell: (props: { row: { original: SearchResult } }) => {
          const row = props.row.original
          return <NameColumn row={row} />
        },
      },
      {
        header: 'Email',
        accessorKey: 'email',
        cell: (props: { row: { original: SearchResult } }) => (
          <span className="text-gray-900 dark:text-gray-100">
            {props.row.original.email}
          </span>
        ),
      },
      {
        header: 'Company',
        accessorKey: 'company',
        cell: (props: { row: { original: SearchResult } }) => (
          <span className="text-gray-900 dark:text-gray-100">
            {props.row.original.company || '-'}
          </span>
        ),
      },
      {
        header: 'Owner',
        accessorKey: 'ownerName',
        cell: (props: { row: { original: SearchResult } }) => {
          const row = props.row.original
          return <OwnerColumn row={row} />
        },
      },
      {
        header: 'Added',
        accessorKey: 'createdAt',
        cell: (props: { row: { original: SearchResult } }) => (
          <DateFormat date={props.row.original.createdAt} format="short" />
        ),
      },
      {
        header: '',
        id: 'action',
        cell: (props: { row: { original: SearchResult } }) => (
          <ActionColumn
            row={props.row.original}
            onRequestIntroduction={onRequestIntroduction}
          />
        ),
      },
    ],
    [onRequestIntroduction],
  )

  return (
    <DataTable
      columns={columns}
      data={sortedResults}
      noData={!isLoading && sortedResults.length === 0}
      skeletonAvatarColumns={[0]}
      skeletonAvatarProps={{ width: 40, height: 40 }}
      loading={isLoading}
      pagingData={{
        total,
        pageIndex: page,
        pageSize,
      }}
      onPaginationChange={onPageChange}
      onSelectChange={onPageSizeChange}
      onSort={handleSort}
    />
  )
}

export default SearchResultsTable
