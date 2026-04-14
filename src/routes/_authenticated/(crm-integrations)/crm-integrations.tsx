import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import CRMIntegrationsList from './-components/CRMIntegrationsList'
import { Container } from '@/components/shared'
import { toast } from '@/components/ui'

const crmIntegrationsSearchSchema = z.object({
  success: z.string().optional(),
  error: z.string().optional(),
})

export const Route = createFileRoute(
  '/_authenticated/(crm-integrations)/crm-integrations',
)({
  validateSearch: crmIntegrationsSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { success, error } = Route.useSearch()

  // Handle OAuth callback notifications
  useEffect(() => {
    if (success === 'connected') {
      toast.push(
        <div>
          <h6 className="font-semibold">HubSpot Connected!</h6>
          <p className="text-sm">
            Your HubSpot account has been successfully connected.
          </p>
        </div>,
        {
          type: 'success',
        },
      )
      // Clear the query parameter
      navigate({
        to: '/crm-integrations',
        replace: true,
      })
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_failed: 'OAuth authorization failed. Please try again.',
        missing_code: 'Authorization code missing. Please try again.',
        connection_failed:
          'Failed to connect to HubSpot. Please check your credentials and try again.',
      }

      toast.push(
        <div>
          <h6 className="font-semibold">Connection Failed</h6>
          <p className="text-sm">
            {errorMessages[error] || 'An unexpected error occurred.'}
          </p>
        </div>,
        {
          type: 'error',
        },
      )
      // Clear the query parameter
      navigate({
        to: '/crm-integrations',
        replace: true,
      })
    }
  }, [success, error, navigate])

  return (
    <Container>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">CRM Integrations</h1>
          <p className="mt-2 text-muted-foreground">
            Connect your CRM platforms to sync contacts automatically
          </p>
        </div>

        {/* Integrations List */}
        <CRMIntegrationsList />
      </div>
    </Container>
  )
}

// Made with Bob
