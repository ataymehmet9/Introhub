import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useContactStore } from '../-store/contactStore'
import type { Contact, InsertContact, UpdateContact } from '@/schemas'
import { useTRPC } from '@/integrations/trpc/react'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { Notification, toast } from '@/components/ui'

interface UseContactOptions {
  company?: string | null
  enabled?: boolean // Control whether to fetch data
  onCreateSuccess?: () => void
  onUpdateSuccess?: () => void
  onDeleteSuccess?: () => void
}

export function useContact(options: UseContactOptions = {}) {
  const {
    company = null,
    enabled = true, // Default to true for backward compatibility
    onCreateSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
  } = options

  const {
    tableData,
    setTableData,
    selectedContact,
    setSelectedContact,
    setSelectAllContact,
  } = useContactStore((state) => state)

  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const queryKey = trpc.contacts.list.queryKey({ company })

  // Only fetch if enabled - prevents unnecessary queries in child components
  const { data, isFetching: isLoading } = useQuery({
    ...trpc.contacts.list.queryOptions({ company }),
    enabled,
  })

  // Create contact mutation with optimistic updates
  const createContactMutation = useMutation({
    mutationFn: (data: InsertContact) =>
      trpcClient.contacts.create.mutate(data),
    onMutate: async (newContact) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousContacts =
        queryClient.getQueryData<Array<Contact>>(queryKey)

      // Optimistically update to the new value
      queryClient.setQueryData<Array<Contact>>(queryKey, (old) => {
        if (!old || !Array.isArray(old)) return []
        return [
          {
            ...newContact,
            id: Date.now(), // Temporary ID
            userId: '', // Will be set by server
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Contact,
          ...old,
        ]
      })

      return { previousContacts }
    },
    onError: (error: Error, _newContact, context) => {
      // Rollback on error
      if (context?.previousContacts) {
        queryClient.setQueryData<Array<Contact>>(
          queryKey,
          context.previousContacts,
        )
      }
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to add contact'}
        </Notification>,
      )
    },
    onSuccess: () => {
      toast.push(
        <Notification type="success" title="Contact added">
          Contact has been successfully added
        </Notification>,
      )
      onCreateSuccess?.()
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Update contact mutation with optimistic updates
  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContact }) =>
      trpcClient.contacts.update.mutate({ id, data }),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey })

      const previousContacts =
        queryClient.getQueryData<Array<Contact>>(queryKey)

      queryClient.setQueryData<Array<Contact>>(queryKey, (old) => {
        if (!old || !Array.isArray(old)) return []
        return old.map((contact) =>
          contact.id === id
            ? { ...contact, ...data, updatedAt: new Date() }
            : contact,
        )
      })

      return { previousContacts }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData<Array<Contact>>(
          queryKey,
          context.previousContacts,
        )
      }
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to update contact'}
        </Notification>,
      )
    },
    onSuccess: () => {
      toast.push(
        <Notification type="success" title="Contact updated">
          Contact has been successfully updated
        </Notification>,
      )
      onUpdateSuccess?.()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Delete contact mutation with optimistic updates
  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => trpcClient.contacts.delete.mutate({ id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })

      const previousContacts =
        queryClient.getQueryData<Array<Contact>>(queryKey)

      queryClient.setQueryData<Array<Contact>>(queryKey, (old) => {
        if (!old || !Array.isArray(old)) return []
        return old.filter((contact) => contact.id !== id)
      })

      return { previousContacts }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData<Array<Contact>>(
          queryKey,
          context.previousContacts,
        )
      }
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to delete contact'}
        </Notification>,
      )
    },
    onSuccess: () => {
      toast.push(
        <Notification type="success" title="Contact deleted">
          Contact has been successfully deleted
        </Notification>,
      )
      onDeleteSuccess?.()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Batch delete contacts mutation with optimistic updates
  const deleteBatchContactMutation = useMutation({
    mutationFn: (ids: Array<number>) =>
      trpcClient.contacts.batchDelete.mutate({ ids }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey })

      const previousContacts =
        queryClient.getQueryData<Array<Contact>>(queryKey)

      queryClient.setQueryData<Array<Contact>>(queryKey, (old) => {
        if (!old || !Array.isArray(old)) return []
        return old.filter((contact) => !ids.includes(contact.id))
      })

      return { previousContacts }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData<Array<Contact>>(
          queryKey,
          context.previousContacts,
        )
      }
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to delete contacts'}
        </Notification>,
      )
    },
    onSuccess: (result) => {
      const count = result.data?.deletedCount
      toast.push(
        <Notification type="success" title="Contacts deleted">
          {count} {count === 1 ? 'contact has' : 'contacts have'} been
          successfully deleted
        </Notification>,
      )
      onDeleteSuccess?.()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const contacts = data?.data ?? []
  const contactsTotal = contacts.length

  return {
    tableData,
    setTableData,
    selectedContact,
    setSelectedContact,
    setSelectAllContact,
    contacts,
    contactsTotal,
    isLoading,
    createContact: createContactMutation.mutateAsync,
    updateContact: updateContactMutation.mutateAsync,
    deleteContact: deleteContactMutation.mutateAsync,
    deleteBatchContact: deleteBatchContactMutation.mutateAsync,
    queryKey,
    queryClient,
  }
}
