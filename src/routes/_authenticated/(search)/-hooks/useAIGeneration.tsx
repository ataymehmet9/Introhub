import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { usePostHog } from '@posthog/react'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useTRPC } from '@/integrations/trpc/react'
import { Notification, toast } from '@/components/ui'

interface UseAIGenerationOptions {
  onSuccess?: (message: string) => void
  onError?: (error: Error) => void
}

export function useAIGeneration(options: UseAIGenerationOptions = {}) {
  const { onSuccess, onError } = options
  const navigate = useNavigate()
  const trpc = useTRPC()
  const posthog = usePostHog()
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch plan details to check if user is on Pro plan
  const { data: planDetails } = useQuery({
    ...trpc.billing.getPlanDetails.queryOptions(),
  })

  // Fetch rate limit status
  const { data: rateLimit, refetch: refetchRateLimit } = useQuery({
    ...trpc.ai.checkRateLimit.queryOptions(),
    enabled: planDetails?.planType === 'pro',
  })

  // Check if user is on Pro plan
  const isPro = planDetails?.planType === 'pro'

  // Generate AI message mutation
  const generateMutation = useMutation({
    mutationFn: ({
      targetContactId,
      previousMessages,
    }: {
      targetContactId: number
      previousMessages?: Array<string>
    }) =>
      trpcClient.ai.generateIntroductionMessage.mutate({
        targetContactId,
        previousMessages,
      }),
    onMutate: () => {
      setIsGenerating(true)
    },
    onSuccess: (data) => {
      setIsGenerating(false)

      if (data.success && data.message) {
        // Track successful generation
        posthog.capture('ai_generation_completed', {
          success: true,
          responseTimeMs: data.responseTimeMs,
          tokensUsed: data.tokensUsed,
        })

        // Refetch rate limit to update remaining count
        refetchRateLimit()

        // Call success callback (no toast for success - UI change is enough)
        onSuccess?.(data.message)
      }
    },
    onError: (error: Error) => {
      setIsGenerating(false)

      // Track failed generation
      posthog.capture('ai_generation_completed', {
        success: false,
        errorType: error.message,
      })

      // Check if error is due to not being on Pro plan
      if (error.message.includes('Pro users')) {
        toast.push(
          <Notification type="warning" title="Upgrade to Pro" duration={6000}>
            AI-powered messages are available for Pro users. Upgrade now to
            unlock this feature!
          </Notification>,
        )
      } else if (error.message.includes('Rate limit')) {
        // Extract time until reset from error message if available
        const timeMatch = error.message.match(/(\d+)\s*minute/)
        const resetTime = timeMatch ? timeMatch[1] : 'soon'

        toast.push(
          <Notification
            type="warning"
            title="Rate limit reached"
            duration={6000}
          >
            You've reached your hourly limit. Try again in {resetTime} minutes.
          </Notification>,
        )

        // Refetch rate limit to update UI
        refetchRateLimit()
      } else {
        toast.push(
          <Notification type="danger" title="Generation failed">
            {error.message ||
              'Failed to generate AI message. Please try again.'}
          </Notification>,
        )
      }

      onError?.(error)
    },
  })

  // Handle enhance with AI button click
  const handleEnhanceWithAI = (
    targetContactId: number,
    isRegeneration = false,
    previousMessages?: Array<string>,
  ) => {
    if (!isPro) {
      // Track upgrade prompt click
      posthog.capture('ai_upgrade_prompt_clicked', {
        planType: planDetails?.planType || 'free',
      })

      // Redirect to billing page for free users
      navigate({ to: '/me/billing' })
      return
    }

    // Check rate limit before generating
    if (rateLimit && rateLimit.remaining <= 0) {
      // Calculate minutes until reset
      const now = new Date()
      const resetAt = new Date(rateLimit.resetAt)
      const minutesUntilReset = Math.ceil(
        (resetAt.getTime() - now.getTime()) / (1000 * 60),
      )

      toast.push(
        <Notification type="warning" title="Rate limit reached" duration={6000}>
          You've used all your generations this hour. Try again in{' '}
          {minutesUntilReset} minute{minutesUntilReset !== 1 ? 's' : ''}.
        </Notification>,
      )
      return
    }

    // Track generation initiation
    posthog.capture(
      isRegeneration ? 'ai_generation_regenerated' : 'ai_generation_initiated',
      {
        targetContactId,
        planType: planDetails?.planType,
        remainingGenerations: rateLimit?.remaining,
      },
    )

    // Generate AI message for Pro users
    generateMutation.mutate({ targetContactId, previousMessages })
  }

  return {
    generateAIMessage: handleEnhanceWithAI,
    isGenerating: isGenerating || generateMutation.isPending,
    isPro,
    rateLimit,
    error: generateMutation.error,
  }
}

// Made with Bob
