import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { HiPencil } from 'react-icons/hi2'
import { Avatar, Button, Dialog, Notification, toast } from '@/components/ui'
import { DateFormat } from '@/components/shared/common'
import { Contact, InsertContact, UpdateContact } from '@/schemas'
import ContactForm from '@/components/shared/common/ContactForm'
import ContactImportModal from '@/components/shared/common/ContactImportModal'
import { AdaptiveCard, Container } from '@/components/shared'
import ContactListActionTools from './-components/ContactListActionTools'
import { useContact } from './-hooks/useContact'
import ContactListTableTools from './-components/ContactListTableTools'
import ContactListTable from './-components/ContactListTable'
import { stringToColor } from '@/utils/colours'
import ContactListSelected from './-components/ContactListSelected'

const contactsSearchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(10),
})

export const Route = createFileRoute('/_authenticated/(contacts)/contacts')({
  validateSearch: contactsSearchSchema,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.contacts.list.queryOptions({ company: null }),
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)

  // Use the custom hook for contacts management
  const { createContact, updateContact, queryKey, queryClient } = useContact({
    company: null,
    onCreateSuccess: () => setShowAddDialog(false),
    onUpdateSuccess: () => setEditingContact(null),
  })

  const handleAddContact = async (data: InsertContact) => {
    try {
      await createContact(data)
    } catch (error) {
      // Error is already handled in the mutation's onError callback
      console.error('Failed to add contact:', error)
      throw error // Re-throw so the form knows it failed
    }
  }

  const handleBulkImportComplete = () => {
    // Refresh contacts list after bulk import
    queryClient.invalidateQueries({ queryKey })
    toast.push(
      <Notification type="success" title="Import complete">
        Contacts have been successfully imported
      </Notification>,
    )
  }

  const handleEditContact = async (data: UpdateContact) => {
    if (editingContact) {
      await updateContact({
        id: editingContact.id,
        data,
      })
    }
  }

  return (
    <>
      <Container>
        <AdaptiveCard>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h1>Contacts</h1>
              <ContactListActionTools
                onAddClick={() => setShowAddDialog(true)}
              />
            </div>
            <ContactListTableTools />
            <ContactListTable
              onSelectEditContact={setEditingContact}
              onSelectViewContact={setViewingContact}
            />
          </div>
        </AdaptiveCard>
        <ContactListSelected />
      </Container>

      {/* Add/Import Contacts Modal */}
      <ContactImportModal
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onContactAdded={handleAddContact}
        onBulkImportComplete={handleBulkImportComplete}
      />

      {/* Edit Contact Dialog */}
      <Dialog
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        width={900}
      >
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Edit Contact
          </h2>
          {editingContact && (
            <ContactForm
              initialData={editingContact}
              onSubmit={handleEditContact}
              onCancel={() => setEditingContact(null)}
              submitText="Save Changes"
            />
          )}
        </div>
      </Dialog>

      {/* View Contact Dialog */}
      <Dialog
        isOpen={!!viewingContact}
        onClose={() => setViewingContact(null)}
        width={600}
      >
        {viewingContact && (
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <Avatar
                size={80}
                shape="circle"
                style={{
                  backgroundColor: stringToColor(viewingContact.name),
                }}
                className="text-white font-semibold text-2xl flex-shrink-0 p-4"
              >
                {viewingContact.name?.charAt(0) || 'U'}
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {viewingContact.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {viewingContact.position || 'No position specified'}
                  {viewingContact.company && ` at ${viewingContact.company}`}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingContact.email}
                </p>
              </div>

              {viewingContact.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Phone
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {viewingContact.phone}
                  </p>
                </div>
              )}

              {viewingContact.linkedinUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block">
                    LinkedIn
                  </label>
                  <a
                    href={viewingContact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {viewingContact.linkedinUrl}
                  </a>
                </div>
              )}

              {viewingContact.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Notes
                  </label>
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {viewingContact.notes}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Added
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  <DateFormat date={viewingContact.createdAt} format="long" />
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="default" onClick={() => setViewingContact(null)}>
                Close
              </Button>
              <Button
                variant="solid"
                icon={<HiPencil />}
                onClick={() => {
                  setEditingContact(viewingContact)
                  setViewingContact(null)
                }}
              >
                Edit Contact
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
