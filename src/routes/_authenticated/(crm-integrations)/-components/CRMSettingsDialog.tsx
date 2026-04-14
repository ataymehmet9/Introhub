import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CrmIntegration } from '@/schemas'
import { Button, Dialog, Notification, Select, toast } from '@/components/ui'
import { useTRPC } from '@/integrations/trpc/react'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

interface CRMSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  integration: CrmIntegration
}

const SYNC_FREQUENCY_OPTIONS = [
  { value: '6h', label: 'Every 6 hours' },
  { value: '12h', label: 'Every 12 hours' },
  { value: '24h', label: 'Every 24 hours' },
  { value: 'weekly', label: 'Weekly' },
]

export default function CRMSettingsDialog({
  isOpen,
  onClose,
  integration,
}: CRMSettingsDialogProps) {
  const [syncFrequency, setSyncFrequency] = useState<
    '6h' | '12h' | '24h' | 'weekly'
  >((integration.syncFrequency as '6h' | '12h' | '24h' | 'weekly') || '24h')
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: { provider: 'hubspot'; syncFrequency: string }) =>
      trpcClient.crm.updateSettings.mutate(data),
    onSuccess: () => {
      toast.push(
        <Notification type="success" title="Settings Updated">
          Sync frequency has been updated successfully.
        </Notification>,
      )
      queryClient.invalidateQueries({ queryKey: trpc.crm.list.queryKey() })
      onClose()
    },
    onError: (error: Error) => {
      toast.push(
        <Notification type="danger" title="Update Failed">
          {error.message || 'Failed to update settings. Please try again.'}
        </Notification>,
      )
    },
  })

  const handleSave = () => {
    updateSettingsMutation.mutate({
      provider: integration.provider as 'hubspot',
      syncFrequency,
    })
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Integration Settings</h3>
          <p className="text-muted-foreground text-sm">
            Configure how often contacts are synced from{' '}
            {integration.provider === 'hubspot'
              ? 'HubSpot'
              : integration.provider}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Sync Frequency
            </label>
            <Select
              value={SYNC_FREQUENCY_OPTIONS.find(
                (opt) => opt.value === syncFrequency,
              )}
              options={SYNC_FREQUENCY_OPTIONS}
              onChange={(option: { value: string; label: string } | null) =>
                setSyncFrequency(
                  (option?.value as '6h' | '12h' | '24h' | 'weekly') || '24h',
                )
              }
              placeholder="Select sync frequency"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Contacts will be automatically synced at this interval
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="plain" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="solid"
            onClick={handleSave}
            loading={updateSettingsMutation.isPending}
            disabled={updateSettingsMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

// Made with Bob
