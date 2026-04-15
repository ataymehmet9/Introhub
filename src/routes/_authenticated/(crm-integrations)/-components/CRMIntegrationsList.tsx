import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SiHubspot } from 'react-icons/si'
import { HiClock, HiCog6Tooth } from 'react-icons/hi2'
import { useCRMSyncStatus } from '../-hooks/useCRMSyncStatus'
import HubSpotConnectDialog from './HubSpotConnectDialog'
import CRMSettingsDialog from './CRMSettingsDialog'
import CRMDisconnectDialog from './CRMDisconnectDialog'
import type { CrmIntegration } from '@/schemas'
import {
  Badge,
  Button,
  Card,
  Notification,
  Spinner,
  toast,
} from '@/components/ui'
import { useTRPC } from '@/integrations/trpc/react'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

interface CRMPlatform {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  available: boolean
}

const CRM_PLATFORMS: Array<CRMPlatform> = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts from your HubSpot CRM',
    icon: <SiHubspot className="text-4xl" />,
    color: 'text-orange-500',
    available: true,
  },
  // Future integrations will be added here
]

export default function CRMIntegrationsList() {
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(
    null,
  )
  const [settingsIntegration, setSettingsIntegration] =
    useState<CrmIntegration | null>(null)
  const [disconnectIntegration, setDisconnectIntegration] =
    useState<CrmIntegration | null>(null)

  // Fetch connected integrations
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const integrationsQuery = useQuery({
    ...trpc.crm.list.queryOptions(),
    staleTime: 0, // Always refetch on mount to avoid stale sync status
    refetchOnMount: 'always',
  })

  // Type for integration with real-time sync status
  type IntegrationWithSyncStatus = CrmIntegration & {
    syncStatus: 'idle' | 'syncing' | 'completed' | 'failed'
    lastSyncError: string | null
    syncStartedAt: Date | null
  }
  const integrations = integrationsQuery.data ?? []

  // Real-time sync status via SSE
  const { syncStatus } = useCRMSyncStatus()

  // Track previous sync status to detect transitions (using ref to avoid re-renders)
  const previousSyncStatusRef = useRef<Record<string, string>>({})
  const isInitializedRef = useRef(false)

  // Detect sync status transitions and show toasts only on actual changes
  useEffect(() => {
    // Mark as initialized on first run with data
    if (!isInitializedRef.current && Object.keys(syncStatus).length > 0) {
      // Initialize previous status with current status (don't show toasts for initial state)
      Object.entries(syncStatus).forEach(([provider, status]) => {
        previousSyncStatusRef.current[provider] = status.syncStatus
      })
      isInitializedRef.current = true
      return
    }

    // Process status changes
    Object.entries(syncStatus).forEach(([provider, status]) => {
      const currentStatus = status.syncStatus
      const prevStatus = previousSyncStatusRef.current[provider]

      // Only invalidate cache if status actually changed from syncing to completed/failed
      if (currentStatus === 'completed' && prevStatus === 'syncing') {
        // Refetch to get updated lastSyncedAt and contacts
        queryClient.invalidateQueries({ queryKey: trpc.crm.list.queryKey() })
        // Invalidate all contacts queries (including those with different parameters)
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === 'trpc' &&
            query.queryKey[1] === 'contacts' &&
            query.queryKey[2] === 'list',
        })
      } else if (currentStatus === 'failed' && prevStatus === 'syncing') {
        // Refetch to get updated lastSyncedAt (don't refetch contacts on failure)
        queryClient.invalidateQueries({ queryKey: trpc.crm.list.queryKey() })
      }

      // Update previous status for next comparison
      previousSyncStatusRef.current[provider] = currentStatus
    })
  }, [syncStatus, queryClient, trpc.crm.list])

  // Sync Now mutation
  const syncNowMutation = useMutation({
    mutationFn: (provider: 'hubspot') =>
      trpcClient.crm.syncNow.mutate({ provider }),
    onSuccess: () => {
      toast.push(
        <Notification type="success" title="Sync Started">
          Contact sync has been initiated. You'll be notified when it completes.
        </Notification>,
      )
      // Refetch integrations to show updated sync status
      queryClient.invalidateQueries({ queryKey: trpc.crm.list.queryKey() })
    },
    onError: (error: Error) => {
      // Notification will be created by the background worker if sync fails
      console.error('[CRM] Failed to start sync:', error)
    },
  })
  const handleSyncNow = (platformId: string) => {
    syncNowMutation.mutate(platformId as 'hubspot')
  }

  const handleConnect = (platformId: string) => {
    setConnectingPlatform(platformId)
  }

  const handleCloseDialog = () => {
    setConnectingPlatform(null)
    // Refetch integrations after closing dialog
    integrationsQuery.refetch()
  }

  // Check if a platform is connected
  const isConnected = (platformId: string) => {
    return integrations.some(
      (int: CrmIntegration) => int.provider === platformId,
    )
  }

  // Get integration for a platform with real-time sync status
  const getIntegration = (
    platformId: string,
  ): IntegrationWithSyncStatus | undefined => {
    const integration = integrations.find(
      (int: CrmIntegration) => int.provider === platformId,
    )

    if (!integration) return undefined

    // If there's no active sync (syncStartedAt is null in DB), use DB state
    // This prevents SSE from showing stale "syncing" status on page load
    if (!integration.syncStartedAt) {
      return {
        ...integration,
        syncStatus: integration.syncStatus,
        lastSyncError: integration.lastSyncError,
        syncStartedAt: integration.syncStartedAt,
      }
    }

    // If there's an active sync, merge with real-time SSE status
    if (syncStatus[platformId]) {
      return {
        ...integration,
        syncStatus: syncStatus[platformId].syncStatus as
          | 'idle'
          | 'syncing'
          | 'completed'
          | 'failed',
        lastSyncError: syncStatus[platformId].lastSyncError,
        syncStartedAt: syncStatus[platformId].syncStartedAt,
      }
    }

    // Fallback to DB state
    return {
      ...integration,
      syncStatus: integration.syncStatus,
      lastSyncError: integration.lastSyncError,
      syncStartedAt: integration.syncStartedAt,
    }
  }

  // Separate connected and available platforms
  const connectedPlatforms = CRM_PLATFORMS.filter((p) => isConnected(p.id))
  const availablePlatforms = CRM_PLATFORMS.filter((p) => !isConnected(p.id))

  // Show loading state while fetching to prevent flash of stale data
  if (integrationsQuery.isLoading || integrationsQuery.isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Spinner size={32} className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Connected Integrations Section */}
      {connectedPlatforms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Connected Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connectedPlatforms.map((platform) => {
              const integration = getIntegration(platform.id)

              // Determine status badge content
              let statusBadgeContent = 'Connected'
              let statusBadgeClass = 'bg-green-500 text-white'
              let showSpinner = false

              if (integration?.syncStatus === 'syncing') {
                statusBadgeContent = 'Syncing'
                statusBadgeClass = 'bg-blue-500 text-white'
                showSpinner = true
              } else if (integration?.syncStatus === 'failed') {
                statusBadgeContent = 'Error'
                statusBadgeClass = 'bg-red-500 text-white'
              }

              return (
                <Card
                  key={platform.id}
                  className="h-full"
                  bodyClass="p-6"
                  header={{
                    content: (
                      <div className="flex items-center gap-3">
                        <div className={platform.color}>{platform.icon}</div>
                        <h3 className="text-lg font-semibold">
                          {platform.name}
                        </h3>
                      </div>
                    ),
                    extra: (
                      <div className="flex items-center gap-2">
                        {showSpinner && <Spinner size={14} />}
                        <Badge
                          className={statusBadgeClass}
                          innerClass={statusBadgeClass}
                          content={statusBadgeContent}
                        />
                        <button
                          onClick={() => setSettingsIntegration(integration!)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                          aria-label="Settings"
                        >
                          <HiCog6Tooth className="text-xl" />
                        </button>
                      </div>
                    ),
                    bordered: true,
                  }}
                  footer={{
                    content: (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="solid"
                          size="xs"
                          onClick={() => handleSyncNow(platform.id)}
                          loading={
                            syncNowMutation.isPending ||
                            integration?.syncStatus === 'syncing'
                          }
                          disabled={
                            syncNowMutation.isPending ||
                            integration?.syncStatus === 'syncing'
                          }
                        >
                          {integration?.syncStatus === 'syncing'
                            ? 'Syncing...'
                            : 'Sync Now'}
                        </Button>
                        <Button
                          variant="default"
                          size="xs"
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => setDisconnectIntegration(integration!)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ),
                    bordered: true,
                  }}
                >
                  {/* Platform Info */}
                  <p className="text-muted-foreground text-sm mb-4">
                    {platform.description}
                  </p>

                  {/* Connection Details */}
                  {integration && (
                    <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <HiClock className="text-base flex-shrink-0" />
                        <span>
                          Last synced:{' '}
                          <span className="font-medium text-foreground">
                            {integration.lastSyncedAt
                              ? new Date(
                                  integration.lastSyncedAt,
                                ).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never'}
                          </span>
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Sync frequency:{' '}
                        <span className="font-medium text-foreground capitalize">
                          {integration.syncFrequency}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Integrations Section */}
      {availablePlatforms.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold my-4">
            {connectedPlatforms.length > 0
              ? 'Available Integrations'
              : 'CRM Integrations'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availablePlatforms.map((platform) => (
              <Card
                key={platform.id}
                className="h-full"
                bodyClass="p-6"
                header={{
                  content: (
                    <div className="flex items-center gap-3">
                      <div className={platform.color}>{platform.icon}</div>
                      <h3 className="text-lg font-semibold">{platform.name}</h3>
                    </div>
                  ),
                  extra: platform.available ? (
                    <Badge
                      className="bg-blue-500 text-white"
                      innerClass="bg-blue-500 text-white"
                      content="Available"
                    />
                  ) : (
                    <Badge content="Coming Soon" />
                  ),
                  bordered: true,
                }}
                footer={{
                  content: (
                    <Button
                      variant="solid"
                      className="w-full"
                      disabled={!platform.available}
                      onClick={() => handleConnect(platform.id)}
                    >
                      {platform.available ? 'Connect' : 'Coming Soon'}
                    </Button>
                  ),
                  bordered: true,
                }}
              >
                {/* Platform Info */}
                <p className="text-muted-foreground text-sm">
                  {platform.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* HubSpot Connect Dialog */}
      {connectingPlatform === 'hubspot' && (
        <HubSpotConnectDialog
          isOpen={true}
          onClose={handleCloseDialog}
          onSuccess={handleCloseDialog}
        />
      )}

      {/* Settings Dialog */}
      {settingsIntegration && (
        <CRMSettingsDialog
          isOpen={true}
          onClose={() => setSettingsIntegration(null)}
          integration={settingsIntegration}
        />
      )}

      {/* Disconnect Dialog */}
      {disconnectIntegration && (
        <CRMDisconnectDialog
          isOpen={true}
          onClose={() => setDisconnectIntegration(null)}
          integration={disconnectIntegration}
          onSuccess={() => {
            setDisconnectIntegration(null)
            integrationsQuery.refetch()
          }}
        />
      )}
    </>
  )
}

// Made with Bob
