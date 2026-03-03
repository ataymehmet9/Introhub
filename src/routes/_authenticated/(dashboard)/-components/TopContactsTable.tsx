import { HiDownload } from 'react-icons/hi'
import type { TopContacts } from '@/schemas'
import { Button, Card } from '@/components/ui'

export interface TopContactsTableProps {
  data: TopContacts | undefined
  loading?: boolean
  title?: string
  onExport?: () => void
}

export function TopContactsTable({
  data,
  loading = false,
  title = 'Top Contacts',
  onExport,
}: TopContactsTableProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-9 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            ></div>
          ))}
        </div>
      </Card>
    )
  }

  if (!data || data.contacts.length === 0) {
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <div className="flex h-64 items-center justify-center text-gray-500 dark:text-gray-400">
          No contacts with requests in the selected period
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {onExport && (
          <Button
            size="sm"
            variant="plain"
            icon={<HiDownload />}
            onClick={onExport}
          >
            Export
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Contact
              </th>
              <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Total
              </th>
              <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Approved
              </th>
              <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Declined
              </th>
              <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Pending
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.contacts.map((contact) => (
              <tr
                key={contact.contactId}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="py-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {contact.contactName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {contact.contactEmail}
                    </p>
                    {contact.contactCompany && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {contact.contactCompany}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-4 text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700 dark:bg-primary-500/20 dark:text-primary-400">
                    {contact.requestCount}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-success-100 px-3 py-1 text-sm font-semibold text-success-700 dark:bg-success-500/20 dark:text-success-400">
                    {contact.approvedCount}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-danger-100 px-3 py-1 text-sm font-semibold text-danger-700 dark:bg-danger-500/20 dark:text-danger-400">
                    {contact.declinedCount}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-warning-100 px-3 py-1 text-sm font-semibold text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">
                    {contact.pendingCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
