import { createServerFn } from '@tanstack/react-start'
import { userEmailSchema } from '@/schemas'
import { authClient } from '@/lib/auth-client'
import appConfig from '@/configs/app.config'
import { authLogger, errorLogger } from '@/integrations/opentelemetry'

export const requestPasswordReset = createServerFn({ method: 'POST' })
  .inputValidator(userEmailSchema)
  .handler(async ({ data }) => {
    const { email } = data
    const startTime = Date.now()

    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${process.env.BETTER_AUTH_URL}${appConfig.authPaths.resetPassword}`,
      })

      // Log password reset request
      authLogger.passwordReset({
        posthogDistinctId: 'anonymous',
        email,
        status: 'success',
        duration_ms: Date.now() - startTime,
      })

      return result
    } catch (error) {
      // Log password reset error
      errorLogger.validation({
        posthogDistinctId: 'anonymous',
        error_type: 'password_reset_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        stack_trace: error instanceof Error ? error.stack : undefined,
        context: { email },
      })

      throw error
    }
  })
