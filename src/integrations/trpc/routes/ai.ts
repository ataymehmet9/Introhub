import { TRPCError } from '@trpc/server'
import * as Sentry from '@sentry/tanstackstart-react'
import { eq } from 'drizzle-orm'
import { createTRPCRouter, protectedProcedure } from '../init'
import {
  checkRateLimitResponseSchema,
  generateIntroductionMessageInputSchema,
  generateIntroductionMessageResponseSchema,
} from '@/schemas'
import { generateIntroductionMessageWithRetry } from '@/services/ai.service'
import {
  sanitizeIntroductionMessage,
  validateIntroductionMessage,
} from '@/services/ai-validation.service'
import {
  checkRateLimit,
  getRateLimitInfo,
  recordGeneration,
} from '@/services/ai-rate-limit.service'
import { contacts } from '@/db/schema'
import { aiLogger, errorLogger } from '@/integrations/opentelemetry'

export const aiRouter = createTRPCRouter({
  /**
   * Generate AI-powered introduction message
   */
  generateIntroductionMessage: protectedProcedure
    .input(generateIntroductionMessageInputSchema)
    .output(generateIntroductionMessageResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const startTime = Date.now()

      try {
        // Fetch full user data from database to get planType
        const user = await ctx.db.query.user.findFirst({
          where: (users, { eq: eqOp }) => eqOp(users.id, ctx.user!.id),
        })

        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found',
          })
        }

        // Check if user is on Pro plan
        const isPro = user.planType === 'pro'

        if (!isPro) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message:
              'AI generation is only available for Pro users. Please upgrade your plan.',
          })
        }

        // Check rate limit
        const rateLimitCheck = await checkRateLimit(user.id)

        if (!rateLimitCheck.allowed) {
          // Log rate limit exceeded
          aiLogger.rateLimitExceeded({
            posthogDistinctId: user.id,
            generations_this_hour: rateLimitCheck.generationsThisHour,
            limit: getRateLimitInfo().limit,
            reset_at: rateLimitCheck.resetAt.toISOString(),
          })

          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Rate limit exceeded. You have used ${rateLimitCheck.generationsThisHour} of ${getRateLimitInfo().limit} AI generations this hour. Please try again after ${rateLimitCheck.resetAt.toLocaleTimeString()}.`,
          })
        }

        // Log AI generation requested
        aiLogger.generationRequested({
          posthogDistinctId: user.id,
          target_contact_id: input.targetContactId,
          model: 'llama-3.3-70b-versatile',
          rate_limit_remaining:
            getRateLimitInfo().limit - rateLimitCheck.generationsThisHour,
        })

        // Fetch target contact with owner information
        const targetContact = await ctx.db.query.contacts.findFirst({
          where: eq(contacts.id, input.targetContactId),
          with: {
            user: true,
          },
        })

        if (!targetContact) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Target contact not found',
          })
        }

        // Check if user is trying to request introduction to their own contact
        if (targetContact.userId === user.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You cannot request an introduction to your own contact',
          })
        }

        // Prepare search result format for AI service
        const searchResult = {
          id: targetContact.id,
          name: targetContact.name,
          email: targetContact.email,
          company: targetContact.company,
          position: targetContact.position,
          phone: targetContact.phone,
          linkedinUrl: targetContact.linkedinUrl,
          createdAt: targetContact.createdAt,
          ownerId: targetContact.userId,
          ownerName: targetContact.user.name,
          ownerEmail: targetContact.user.email,
          ownerCompany: targetContact.user.company,
          ownerPosition: targetContact.user.position,
          hasPendingRequest: false,
          pendingRequestId: null,
        }

        // Generate AI message with retry
        const result = await generateIntroductionMessageWithRetry(
          user,
          searchResult,
          input.previousMessages,
        )

        const responseTimeMs = Date.now() - startTime

        // Record generation attempt
        await recordGeneration(user.id, {
          generationType: 'introduction_message',
          targetContactId: input.targetContactId,
          success: result.success,
          errorMessage: result.error,
          tokensUsed: result.tokensUsed,
          responseTimeMs: result.responseTimeMs || responseTimeMs,
          metadata: {
            model: 'llama-3.3-70b-versatile',
            requesterName: user.name,
            requesterCompany: user.company,
            requesterPosition: user.position,
            targetContactName: targetContact.name,
            targetContactCompany: targetContact.company,
            targetContactPosition: targetContact.position,
            ownerName: targetContact.user.name,
            ownerCompany: targetContact.user.company,
          },
        })

        if (!result.success || !result.message) {
          // Log AI generation failure
          aiLogger.generationCompleted({
            posthogDistinctId: user.id,
            target_contact_id: input.targetContactId,
            error_type: 'generation_failed',
            error_message: result.error || 'Failed to generate AI message',
            duration_ms: responseTimeMs,
          })

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message:
              result.error ||
              'Failed to generate AI message. Please try again or use the template.',
          })
        }

        // Log successful AI generation
        aiLogger.generationCompleted({
          posthogDistinctId: user.id,
          target_contact_id: input.targetContactId,
          duration_ms: result.responseTimeMs || responseTimeMs,
          token_count: result.tokensUsed,
        })

        // Sanitize the message
        const sanitizedMessage = sanitizeIntroductionMessage(result.message)

        // Validate the message
        const validation = validateIntroductionMessage(sanitizedMessage, {
          requesterName: user.name,
          targetContactName: targetContact.name,
          ownerName: targetContact.user.name,
        })

        // If validation fails, log warning but still return the message
        // (user can edit it if needed)
        if (!validation.isValid) {
          console.warn('AI message validation warnings:', validation.errors)
          Sentry.captureMessage('AI message validation warnings', {
            level: 'warning',
            extra: {
              errors: validation.errors,
              userId: user.id,
              targetContactId: input.targetContactId,
            },
          })
        }

        return {
          success: true,
          message: sanitizedMessage,
          tokensUsed: result.tokensUsed,
          responseTimeMs: result.responseTimeMs || responseTimeMs,
        }
      } catch (error) {
        // Log error
        errorLogger.system({
          posthogDistinctId: ctx.user!.id,
          error_type: 'ai_generation_error',
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
          stack_trace: error instanceof Error ? error.stack : undefined,
          context: {
            targetContactId: input.targetContactId,
          },
        })

        // Record failed generation
        await recordGeneration(ctx.user!.id, {
          generationType: 'introduction_message',
          targetContactId: input.targetContactId,
          success: false,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          responseTimeMs: Date.now() - startTime,
        })

        // Re-throw TRPC errors
        if (error instanceof TRPCError) {
          throw error
        }

        // Log unexpected errors to Sentry
        Sentry.captureException(error, {
          tags: {
            service: 'ai',
            operation: 'generateIntroductionMessage',
          },
          extra: {
            userId: ctx.user!.id,
            targetContactId: input.targetContactId,
          },
        })

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        })
      }
    }),

  /**
   * Check rate limit status
   */
  checkRateLimit: protectedProcedure
    .output(checkRateLimitResponseSchema)
    .query(async ({ ctx }) => {
      const result = await checkRateLimit(ctx.user!.id)
      return result
    }),

  /**
   * Get rate limit info
   */
  getRateLimitInfo: protectedProcedure.query(() => {
    return getRateLimitInfo()
  }),
})

// Made with Bob
