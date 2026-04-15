import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CrmIntegration } from '@/schemas'
import {
  Button,
  Dialog,
  Input,
  Notification,
  Radio,
  toast,
} from '@/components/ui'
import { useTRPC } from '@/integrations/trpc/react'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

interface CRMDisconnectDialogProps {
  isOpen: boolean
  onClose: () => void
  integration: CrmIntegration
  onSuccess?: () => void
}

export default function CRMDisconnectDialog({
  isOpen,
  onClose,
  integration,
  onSuccess,
}: CRMDisconnectDialogProps) {
  const [deleteContacts, setDeleteContacts] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Fetch contact count for this CRM
  const contactCountQuery = useQuery({
    ...trpc.crm.getContactCount.queryOptions({
      provider: integration.provider as 'hubspot',
    }),
    enabled: isOpen,
  })

  const contactCount = contactCountQuery.data?.count || 0

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (data: { provider: 'hubspot'; deleteContacts: boolean }) =>
      trpcClient.crm.disconnect.mutate(data),
    onSuccess: () => {
      toast.push(
        <Notification type="success" title="Integration Disconnected">
          {integration.provider === 'hubspot'
            ? 'HubSpot'
            : integration.provider}{' '}
          integration has been disconnected successfully.
        </Notification>,
      )
      queryClient.invalidateQueries({ queryKey: trpc.crm.list.queryKey() })
      onSuccess?.()
      onClose()
    },
    onError: (error: Error) => {
      toast.push(
        <Notification type="danger" title="Disconnect Failed">
          {error.message || 'Failed to disconnect. Please try again.'}
        </Notification>,
      )
    },
  })

  const handleDisconnect = () => {
    disconnectMutation.mutate({
      provider: integration.provider as 'hubspot',
      deleteContacts,
    })
  }

  const isConfirmValid = deleteContacts
    ? confirmText.toLowerCase() === 'delete'
    : true

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 text-red-600">
            Disconnect Integration
          </h3>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to disconnect your{' '}
            {integration.provider === 'hubspot'
              ? 'HubSpot'
              : integration.provider}{' '}
            integration?
          </p>
        </div>

        {contactCountQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">
            Loading contact count...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {contactCount} contact{contactCount !== 1 ? 's' : ''} synced
                from this integration
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">
                What should happen to synced contacts?
              </p>

              <Radio.Group
                value={deleteContacts ? 'delete' : 'keep'}
                onChange={(value) => {
                  setDeleteContacts(value === 'delete')
                  setConfirmText('')
                }}
                className="flex flex-col gap-3"
              >
                <Radio value="keep" className="w-full">
                  <div className="ml-2">
                    <p className="font-medium">Keep contacts in IntroHub</p>
                    <p className="text-xs text-muted-foreground">
                      Contacts will remain in your account but won't sync
                      anymore
                    </p>
                  </div>
                </Radio>
                <Radio value="delete" className="w-full">
                  <div className="ml-2">
                    <p className="font-medium text-red-600">
                      Delete all synced contacts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This will permanently remove {contactCount} contact
                      {contactCount !== 1 ? 's' : ''} from IntroHub
                    </p>
                  </div>
                </Radio>
              </Radio.Group>
            </div>

            {deleteContacts && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium text-red-600">
                  Type "DELETE" to confirm deletion
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="font-mono"
                />
                {confirmText && !isConfirmValid && (
                  <p className="text-xs text-red-600">
                    Please type "DELETE" exactly to confirm
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="plain" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="solid"
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDisconnect}
            loading={disconnectMutation.isPending}
            disabled={
              disconnectMutation.isPending ||
              !isConfirmValid ||
              contactCountQuery.isLoading
            }
          >
            Disconnect
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

// Made with Bob
