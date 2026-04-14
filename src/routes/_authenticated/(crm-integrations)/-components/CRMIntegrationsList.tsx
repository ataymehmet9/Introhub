import { useState } from 'react'
import { SiHubspot } from 'react-icons/si'
import { HiCheckCircle, HiClock } from 'react-icons/hi2'
import HubSpotConnectDialog from './HubSpotConnectDialog'
import type { CrmIntegration } from '@/schemas'
import { AdaptiveCard } from '@/components/shared'
import { Badge, Button } from '@/components/ui'
import { useTRPC } from '@/integrations/trpc/react'

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

  // Fetch connected integrations
  const trpc = useTRPC()
  const integrationsQuery = trpc.crm.list.useQuery()
  const integrations = integrationsQuery.data ?? []

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

  // Get integration for a platform
  const getIntegration = (platformId: string) => {
    return integrations.find(
      (int: CrmIntegration) => int.provider === platformId,
    )
  }

  // Separate connected and available platforms
  const connectedPlatforms = CRM_PLATFORMS.filter((p) => isConnected(p.id))
  const availablePlatforms = CRM_PLATFORMS.filter((p) => !isConnected(p.id))

  return (
    <>
      {/* Connected Integrations Section */}
      {connectedPlatforms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Connected Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectedPlatforms.map((platform) => {
              const integration = getIntegration(platform.id)
              return (
                <AdaptiveCard key={platform.id} className="h-full">
                  <div className="flex flex-col h-full">
                    {/* Platform Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${platform.color}`}>{platform.icon}</div>
                      <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                        <HiCheckCircle />
                        Connected
                      </Badge>
                    </div>

                    {/* Platform Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        {platform.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        {platform.description}
                      </p>

                      {/* Connection Details */}
                      {integration && (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <HiClock className="text-base" />
                            <span>
                              Last synced:{' '}
                              {integration.lastSyncedAt
                                ? new Date(
                                    integration.lastSyncedAt,
                                  ).toLocaleDateString()
                                : 'Never'}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            Sync frequency: {integration.syncFrequency}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-2">
                      <Button variant="solid" className="flex-1">
                        Sync Now
                      </Button>
                      <Button variant="plain" className="flex-1">
                        Settings
                      </Button>
                    </div>
                  </div>
                </AdaptiveCard>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Integrations Section */}
      {availablePlatforms.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {connectedPlatforms.length > 0
              ? 'Available Integrations'
              : 'CRM Integrations'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlatforms.map((platform) => (
              <AdaptiveCard key={platform.id} className="h-full">
                <div className="flex flex-col h-full">
                  {/* Platform Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${platform.color}`}>{platform.icon}</div>
                    {platform.available ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        Available
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        Coming Soon
                      </Badge>
                    )}
                  </div>

                  {/* Platform Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {platform.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {platform.description}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="mt-6">
                    <Button
                      variant="solid"
                      className="w-full"
                      disabled={!platform.available}
                      onClick={() => handleConnect(platform.id)}
                    >
                      {platform.available ? 'Connect' : 'Coming Soon'}
                    </Button>
                  </div>
                </div>
              </AdaptiveCard>
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
    </>
  )
}

// Made with Bob
