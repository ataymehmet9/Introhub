import { SiHubspot } from 'react-icons/si'
import { HiCheckCircle } from 'react-icons/hi2'
import { Button, Dialog } from '@/components/ui'

interface HubSpotConnectDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function HubSpotConnectDialog({
  isOpen,
  onClose,
}: HubSpotConnectDialogProps) {
  const handleAuthorize = () => {
    // Get the OAuth URL from environment variables
    const clientId = import.meta.env.VITE_HUBSPOT_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/crm/hubspot/callback`
    const scopes = 'crm.objects.contacts.read crm.objects.contacts.write'

    // Build the HubSpot OAuth URL
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`

    // Redirect to HubSpot OAuth
    window.location.href = authUrl
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-orange-500">
            <SiHubspot className="text-5xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Connect HubSpot</h2>
            <p className="text-muted-foreground">
              Sync your contacts from HubSpot
            </p>
          </div>
        </div>

        {/* Permissions Info */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">
            This integration will request access to:
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <HiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                Read your HubSpot contacts (name, email, company, phone, etc.)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <HiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                Sync contacts to your IntroHub account
              </span>
            </li>
            <li className="flex items-start gap-2">
              <HiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                Keep contacts up-to-date with automatic syncing
              </span>
            </li>
          </ul>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> You'll be redirected to HubSpot to authorize
            this connection. After authorization, you'll be brought back here to
            complete the setup.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="plain" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" onClick={handleAuthorize}>
            Authorize with HubSpot
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

// Made with Bob
