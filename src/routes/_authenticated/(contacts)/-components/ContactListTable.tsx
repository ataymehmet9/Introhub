import { TbEye, TbPencil, TbTrash } from 'react-icons/tb'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useContact } from '../-hooks/useContact'
import type { ColumnDef, OnSortParam, Row } from '@/components/shared/DataTable'
import type { Contact } from '@/schemas'
import { Avatar, Button, Dialog, Tooltip } from '@/components/ui'
import { stringToColor } from '@/utils/colours'
import DataTable from '@/components/shared/DataTable'
import { DateFormat } from '@/components/shared/common'

type ContactListTableProps = {
  onSelectEditContact: (contact: Contact) => void
  onSelectViewContact: (contact: Contact) => void
}

const NameColumn = ({ row }: { row: Contact }) => {
  const avatarColor = stringToColor(row.name)

  return (
    <div className="flex items-center gap-3">
      <Avatar
        size={40}
        shape="circle"
        style={{ backgroundColor: avatarColor }}
        className="text-white font-semibold flex-shrink-0 p-4"
      >
        {row.name?.charAt(0) || 'U'}
      </Avatar>
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {row.name}
      </div>
    </div>
  )
}

const ActionColumn = ({
  onEdit,
  onViewDetail,
  onDelete,
}: {
  onEdit: () => void
  onViewDetail: () => void
  onDelete: () => void
}) => {
  return (
    <div className="flex items-center gap-3">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none font-semibold`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className={`text-xl cursor-pointer select-none font-semibold`}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Delete">
        <div
          className={`text-xl cursor-pointer select-none font-semibold`}
          role="button"
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip>
    </div>
  )
}

const ContactListTable = ({
  onSelectEditContact,
  onSelectViewContact,
}: ContactListTableProps) => {
  const navigate = useNavigate()
  const searchParams = useSearch({
    from: '/_authenticated/(contacts)/contacts',
  })

  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const {
    contacts: allContacts,
    isLoading,
    setSelectAllContact,
    setSelectedContact,
    selectedContact,
    deleteContact,
  } = useContact()

  // Filter contacts based on search query from URL
  const filteredContacts = useMemo(() => {
    const query = searchParams.q?.toLowerCase() || ''
    if (!query) return allContacts

    return allContacts.filter((contact) => {
      return (
        contact.name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.position?.toLowerCase().includes(query)
      )
    })
  }, [allContacts, searchParams.q])

  // Pagination state from URL - URL is source of truth
  const pageIndex = searchParams.page || 1
  const pageSize = searchParams.pageSize || 10

  // Paginate filtered contacts
  const paginatedContacts = useMemo(() => {
    const startIndex = (pageIndex - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredContacts.slice(startIndex, endIndex)
  }, [filteredContacts, pageIndex, pageSize])

  const contactsTotal = filteredContacts.length

  const columns: Array<ColumnDef<Contact>> = useMemo(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
        cell: (props: { row: { original: Contact } }) => {
          const row = props.row.original
          return <NameColumn row={row} />
        },
      },
      {
        header: 'Email',
        accessorKey: 'email',
      },
      {
        header: 'Company',
        accessorKey: 'company',
      },
      {
        header: 'Position',
        accessorKey: 'position',
      },
      {
        header: 'Added',
        accessorKey: 'createdAt',
        cell: (props: { row: { original: Contact } }) => (
          <DateFormat date={props.row.original.createdAt} format="short" />
        ),
      },
      {
        header: '',
        id: 'action',
        cell: (props: { row: { original: Contact } }) => (
          <ActionColumn
            onEdit={() => onSelectEditContact(props.row.original)}
            onViewDetail={() => onSelectViewContact(props.row.original)}
            onDelete={() => setDeletingContact(props.row.original)}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const handlePaginationChange = (page: number) => {
    navigate({
      to: '/contacts',
      search: {
        q: searchParams.q,
        page,
        pageSize: searchParams.pageSize,
      },
      replace: true,
    })
    if (selectedContact.length > 0) {
      setSelectAllContact([])
    }
  }

  const handleSelectChange = (newPageSize: number) => {
    // Page size change - reset to page 1 and update pageSize in URL
    navigate({
      to: '/contacts',
      search: {
        q: searchParams.q,
        page: 1,
        pageSize: newPageSize,
      },
      replace: true,
    })
    if (selectedContact.length > 0) {
      setSelectAllContact([])
    }
  }

  const handleSort = (sort: OnSortParam) => {
    // Sorting - you could add sort params to URL if needed
    // For now, this is a placeholder
    console.log('Sort:', sort)
  }

  const handleRowSelect = (checked: boolean, row: Contact) => {
    setSelectedContact(checked, row)
  }

  const handleAllRowSelect = (checked: boolean, rows: Array<Row<Contact>>) => {
    if (checked) {
      const originalRows = rows.map((row) => row.original)
      setSelectAllContact(originalRows)
    } else {
      setSelectAllContact([])
    }
  }

  const handleDeletingDialogClose = () => {
    setDeletingContact(null)
  }

  const handleDeleteContactConfirm = async () => {
    await deleteContact(deletingContact!.id)
    setDeletingContact(null)
  }

  return (
    <>
      <DataTable
        selectable
        columns={columns}
        data={paginatedContacts}
        noData={!isLoading && paginatedContacts.length === 0}
        skeletonAvatarColumns={[0]}
        skeletonAvatarProps={{ width: 28, height: 28 }}
        loading={isLoading}
        pagingData={{
          total: contactsTotal,
          pageIndex: pageIndex,
          pageSize: pageSize,
        }}
        checkboxChecked={(row) =>
          selectedContact.some((selected) => selected.id === row.id)
        }
        onPaginationChange={handlePaginationChange}
        onSelectChange={handleSelectChange}
        onSort={handleSort}
        onCheckBoxChange={handleRowSelect}
        onIndeterminateCheckBoxChange={handleAllRowSelect}
      />
      <Dialog
        isOpen={!!deletingContact}
        onClose={handleDeletingDialogClose}
        onRequestClose={handleDeletingDialogClose}
      >
        <h5 className="mb-4">Delete Contact?</h5>
        <p>
          Are you sure you want to delete the contact{' '}
          <strong>{deletingContact?.name}</strong>
        </p>
        <div className="text-right mt-6">
          <Button
            className="ltr:mr-2 rtl:ml-2"
            variant="plain"
            onClick={handleDeletingDialogClose}
          >
            Cancel
          </Button>
          <Button variant="solid" onClick={handleDeleteContactConfirm}>
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  )
}

export default ContactListTable
