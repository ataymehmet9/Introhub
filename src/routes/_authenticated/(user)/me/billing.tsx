import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  TbCalendar,
  TbCheck,
  TbChevronDown,
  TbCreditCard,
  TbReceipt,
  TbTrendingUp,
} from 'react-icons/tb'
import { z } from 'zod'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { AdaptiveCard } from '@/components/shared'
import {
  Alert,
  Button,
  Card,
  Notification,
  Progress,
  toast,
} from '@/components/ui'
import { useTRPC } from '@/integrations/trpc/react'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { PLANS } from '@/integrations/stripe/billing-plans'
import { auth } from '@/lib/auth'
import { trpcRouter } from '@/integrations/trpc/router'
import { db } from '@/db'

const billingSearchSchema = z.object({
  success: z.boolean().optional(),
  canceled: z.boolean().optional(),
})

// Server function to fetch billing data
// This runs ONLY on the server and returns serializable data
const getBillingData = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  const { session, user } = (await auth.api.getSession({ headers })) ?? {}

  if (!user) {
    throw new Error('Unauthorized')
  }

  const context = { db, session, user }
  const caller = trpcRouter.createCaller(context)

  // Fetch both subscription and plan details in parallel on the server
  const [subscription, planDetails] = await Promise.all([
    caller.billing.getSubscription(),
    caller.billing.getPlanDetails(),
  ])

  // Return only serializable data (no functions)
  return {
    subscription,
    planDetails,
  }
})

export const Route = createFileRoute('/_authenticated/(user)/me/billing')({
  validateSearch: billingSearchSchema,
  // SSR loader: Pre-fetch billing data on the server
  // Uses streaming SSR (default) to avoid hydration mismatches with client-side state
  loader: async () => {
    return await getBillingData()
  },
  component: RouteComponent,
})

function RouteComponent() {
  const trpc = useTRPC()
  const search = useSearch({ from: '/_authenticated/(user)/me/billing' })
  const [isUsageExpanded, setIsUsageExpanded] = useState(false)

  // Get initial data from SSR loader
  const loaderData = Route.useLoaderData()

  // Keep queries active for background updates and cache invalidation
  // initialData prevents refetch on mount since we have fresh data from SSR
  const { data: subscription } = useQuery({
    ...trpc.billing.getSubscription.queryOptions(),
    initialData: loaderData.subscription,
    staleTime: 5 * 60 * 1000, // 5 minutes - billing data doesn't change frequently
  })

  const { data: planDetails } = useQuery({
    ...trpc.billing.getPlanDetails.queryOptions(),
    initialData: loaderData.planDetails,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const checkoutMutation = useMutation({
    mutationFn: () => trpcClient.billing.createCheckoutSession.mutate(),
    onSuccess: ({ url }) => {
      window.location.href = url
    },
    onError: (error: Error) => {
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to start checkout'}
        </Notification>,
      )
    },
  })

  const portalMutation = useMutation({
    mutationFn: () => trpcClient.billing.createPortalSession.mutate(),
    onSuccess: ({ url }) => {
      window.location.href = url
    },
    onError: (error: Error) => {
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to open billing portal'}
        </Notification>,
      )
    },
  })

  // Data is guaranteed to exist from loader (no optional chaining needed)
  const isPro = subscription.plan === 'pro'
  const isFree = !isPro
  const isMutating = checkoutMutation.isPending || portalMutation.isPending

  // Format date helper
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  // Calculate usage percentage
  const usagePercentage =
    planDetails.requestsLimit && planDetails.requestsLimit > 0
      ? (planDetails.requestsUsed / planDetails.requestsLimit) * 100
      : 0

  return (
    <AdaptiveCard>
      <div>
        <h4 className="mb-6">Billing</h4>

        {search.success && (
          <div className="mb-6 p-4 rounded-lg bg-success-subtle text-success text-sm font-medium">
            You're now on the Pro plan. Thanks for subscribing!
          </div>
        )}

        {search.canceled && (
          <div className="mb-6 p-4 rounded-lg bg-warning-subtle text-warning text-sm font-medium">
            Checkout was canceled. No charges were made.
          </div>
        )}

        {/* Cancellation Notice */}
        {subscription.cancelAtPeriodEnd && (
          <Alert
            showIcon
            type="warning"
            className="mb-6"
            title="Subscription Cancellation Scheduled"
          >
            <div>
              <p>
                Your Pro subscription will be canceled on{' '}
                {formatDate(
                  subscription.cancelAt
                    ? new Date(subscription.cancelAt * 1000)
                    : subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd * 1000)
                      : null,
                )}
                .
              </p>
              <p>
                You'll continue to have Pro access until then. You can
                reactivate your subscription anytime before this date.
              </p>
            </div>
          </Alert>
        )}

        {/* Usage Stats Card - Only for Free Tier */}
        {isFree && (
          <Card className="mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-2 border-blue-200 dark:border-blue-800">
            <button
              onClick={() => setIsUsageExpanded(!isUsageExpanded)}
              className="w-full p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <TbTrendingUp className="text-2xl text-blue-600 dark:text-blue-400" />
                <h6 className="text-gray-900 dark:text-gray-100 font-semibold">
                  Current Usage
                </h6>
              </div>
              <motion.div
                animate={{ rotate: isUsageExpanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <TbChevronDown className="text-xl text-gray-600 dark:text-gray-400" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isUsageExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Requests Used */}
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Requests This Month
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {planDetails.requestsUsed} /{' '}
                          {planDetails.requestsLimit}
                        </p>
                      </div>

                      {/* Requests Remaining */}
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Remaining
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {planDetails.requestsLimit !== null
                            ? planDetails.requestsLimit -
                              planDetails.requestsUsed
                            : '∞'}
                        </p>
                      </div>

                      {/* Next Reset */}
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Resets On
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                          <TbCalendar className="text-base" />
                          {formatDate(planDetails.nextResetDate)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Usage</span>
                      </div>
                      <Progress
                        percent={Math.min(usagePercentage, 100)}
                        size="md"
                      />
                    </div>

                    {/* Warning Message */}
                    {usagePercentage > 99 && (
                      <Alert showIcon type="danger">
                        Your plan has reached its limit. Please upgrade to
                        continue using the service without any restrictions.
                      </Alert>
                    )}

                    {usagePercentage < 100 && usagePercentage >= 80 && (
                      <Alert showIcon type="warning">
                        <strong>Heads up!</strong> You're running low on
                        requests. Upgrade to Pro for unlimited access.
                      </Alert>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        {/* Pro Usage Stats */}
        {isPro && (
          <Card className="mb-6 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TbTrendingUp className="text-2xl text-primary" />
              <h6>Usage Statistics</h6>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Requests This Cycle */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Requests This Month
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {planDetails.usageStats.requestsThisCycle}
                </p>
              </div>

              {/* Average Per Month */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Average Per Month
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {planDetails.usageStats.averagePerMonth.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-success-subtle border border-success">
              <p className="text-sm text-success">
                ✨ You have unlimited requests with your Pro plan
              </p>
            </div>
          </Card>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Free Plan */}
          <Card
            className={`p-6 relative ${!isPro ? 'ring-2 ring-primary' : ''}`}
          >
            {!isPro && (
              <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                Current plan
              </span>
            )}
            <p className="text-lg font-semibold mb-1">{PLANS.free.name}</p>
            <p className="text-3xl font-bold mb-4">
              $0
              <span className="text-sm font-normal text-gray-500">/month</span>
            </p>
            <ul className="space-y-2 mb-6">
              {PLANS.free.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <TbCheck className="text-gray-400 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {isPro && (
              <Button variant="plain" size="sm" className="w-full" disabled>
                Downgrade
              </Button>
            )}
          </Card>

          {/* Pro Plan */}
          <Card
            className={`p-6 relative ${isPro ? 'ring-2 ring-primary' : ''}`}
          >
            {isPro && (
              <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                Current plan
              </span>
            )}
            <p className="text-lg font-semibold mb-1">{PLANS.pro.name}</p>
            <p className="text-3xl font-bold mb-4">
              ${PLANS.pro.price}
              <span className="text-sm font-normal text-gray-500">/month</span>
            </p>
            <ul className="space-y-2 mb-6">
              {PLANS.pro.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <TbCheck className="text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {isPro ? (
              <Button
                variant="solid"
                size="sm"
                className="w-full"
                loading={portalMutation.isPending}
                disabled={isMutating}
                onClick={() => portalMutation.mutate()}
              >
                Manage subscription
              </Button>
            ) : (
              <Button
                variant="solid"
                size="sm"
                className="w-full"
                loading={checkoutMutation.isPending}
                disabled={isMutating}
                onClick={() => checkoutMutation.mutate()}
              >
                Upgrade to Pro
              </Button>
            )}
          </Card>
        </div>

        {/* Payment Method */}
        <Card className="mb-4 p-6">
          <div className="flex items-center gap-3 mb-3">
            <TbCreditCard className="text-xl" />
            <h6>Payment method</h6>
          </div>
          {isPro ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Manage your payment method via the billing portal.
              </p>
              <Button
                size="sm"
                loading={portalMutation.isPending}
                disabled={isMutating}
                onClick={() => portalMutation.mutate()}
              >
                Open portal
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No payment method on file.</p>
          )}
        </Card>

        {/* Billing History */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <TbReceipt className="text-xl" />
            <h6>Billing history</h6>
          </div>
          {isPro ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                View past invoices in the billing portal.
              </p>
              <Button
                size="sm"
                loading={portalMutation.isPending}
                disabled={isMutating}
                onClick={() => portalMutation.mutate()}
              >
                View invoices
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No invoices yet.</p>
          )}
        </Card>
      </div>
    </AdaptiveCard>
  )
}
