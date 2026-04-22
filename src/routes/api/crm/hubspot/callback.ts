import { createFileRoute } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { crmIntegrations } from '@/db/schema'
import { HubSpotService } from '@/services/hubspot.service'
import { tokenStorage } from '@/services/token-storage.service'
import { auth } from '@/lib/auth'
import { trackServerEvent } from '@/integrations/posthog'
import { crmLogger, errorLogger } from '@/integrations/opentelemetry'

export const Route = createFileRoute('/api/crm/hubspot/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const startTime = Date.now()
        try {
          const url = new URL(request.url)
          const code = url.searchParams.get('code')
          const error = url.searchParams.get('error')

          // Handle OAuth errors
          if (error) {
            console.error('HubSpot OAuth error:', error)

            crmLogger.connectionFailed({
              posthogDistinctId: 'unknown',
              provider: 'hubspot',
              error_type: 'oauth_error',
              error_message: error,
            })

            return Response.redirect(
              `${url.origin}/crm-integrations?error=oauth_failed`,
            )
          }

          if (!code) {
            crmLogger.connectionFailed({
              posthogDistinctId: 'unknown',
              provider: 'hubspot',
              error_type: 'missing_code',
              error_message: 'OAuth code missing from callback',
            })

            return Response.redirect(
              `${url.origin}/crm-integrations?error=missing_code`,
            )
          }

          // Get the authenticated user
          const session = await auth.api.getSession({
            headers: request.headers,
          })

          if (!session?.user) {
            return Response.redirect(`${url.origin}/sign-in`)
          }

          // Exchange code for tokens
          const hubspotService = new HubSpotService()
          const tokens = await hubspotService.exchangeCodeForTokens(code)

          // Check if integration already exists
          const existingIntegration = await db.query.crmIntegrations.findFirst({
            where: and(
              eq(crmIntegrations.userId, session.user.id),
              eq(crmIntegrations.provider, 'hubspot'),
            ),
          })

          if (existingIntegration) {
            // Update existing integration
            await db
              .update(crmIntegrations)
              .set({
                status: 'active',
                connectedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(crmIntegrations.id, existingIntegration.id))
          } else {
            // Create new integration - this was missing!
            await tokenStorage.storeTokens(session.user.id, 'hubspot', tokens)
          }

          // Log successful OAuth flow
          const duration = Date.now() - startTime
          crmLogger.oauthFlow({
            posthogDistinctId: session.user.id,
            provider: 'hubspot',
            stage: 'completed',
            is_reconnection: !!existingIntegration,
            duration_ms: duration,
          })

          // Track successful CRM connection in PostHog
          trackServerEvent(session.user.id, 'crm_connected', {
            provider: 'hubspot',
            userId: session.user.id,
            userEmail: session.user.email,
            userName: session.user.name,
            userCompany: session.user.company,
            userPosition: session.user.position,
            isReconnection: !!existingIntegration,
            timestamp: new Date().toISOString(),
          })

          // Redirect back to CRM integrations page with success
          return Response.redirect(
            `${url.origin}/crm-integrations?success=connected`,
          )
        } catch (error) {
          console.error('Error in HubSpot OAuth callback:', error)

          // Log OAuth failure
          errorLogger.externalApi({
            posthogDistinctId: 'unknown',
            error_type: 'hubspot_oauth_failed',
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
            stack_trace: error instanceof Error ? error.stack : undefined,
            endpoint: '/api/crm/hubspot/callback',
          })

          const url = new URL(request.url)
          return Response.redirect(
            `${url.origin}/crm-integrations?error=connection_failed`,
          )
        }
      },
    },
  },
})

// Made with Bob
