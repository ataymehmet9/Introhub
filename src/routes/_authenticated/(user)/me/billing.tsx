import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { TbCheck, TbCreditCard, TbReceipt } from 'react-icons/tb'
import { z } from 'zod'
import { AdaptiveCard } from '@/components/shared'
import { Button, Card, Notification, toast } from '@/components/ui'
import { useTRPC } from '@/integrations/trpc/react'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { PLANS } from '@/integrations/stripe/billing-plans'

const billingSearchSchema = z.object({
  success: z.boolean().optional(),
  canceled: z.boolean().optional(),
})

export const Route = createFileRoute('/_authenticated/(user)/me/billing')({
  validateSearch: billingSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const trpc = useTRPC()
  const search = useSearch({ from: '/_authenticated/(user)/me/billing' })

  const { data: subscription, isLoading } = useQuery({
    ...trpc.billing.getSubscription.queryOptions(),
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

  const isPro = subscription?.plan === 'pro'
  const isMutating = checkoutMutation.isPending || portalMutation.isPending

  return (
    <AdaptiveCard>
      <div>
        <h4 className="mb-6">Billing</h4>

        {search.success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium">
            You're now on the Pro plan. Thanks for subscribing!
          </div>
        )}

        {search.canceled && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm font-medium">
            Checkout was canceled. No charges were made.
          </div>
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
            {!isLoading &&
              (isPro ? (
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
              ))}
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
