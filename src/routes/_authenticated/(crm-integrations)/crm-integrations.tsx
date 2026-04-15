import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import CRMIntegrationsList from './-components/CRMIntegrationsList'
import { Container } from '@/components/shared'
import { Notification, toast } from '@/components/ui'

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
        <Notification
          type="success"
          title="HubSpot Connected!"
          duration={4000}
          closable
        >
          Your HubSpot account has been successfully connected.
        </Notification>,
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
        <Notification
          type="danger"
          title="Connection Failed"
          duration={5000}
          closable
        >
          {errorMessages[error] || 'An unexpected error occurred.'}
        </Notification>,
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
