import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import { stripe } from '@/integrations/stripe/init'
import { db } from '@/db'
import { user as userTable } from '@/db/schema'

export const Route = createFileRoute('/api/billing/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text()
        const signature = request.headers.get('stripe-signature')

        if (!signature) {
          return new Response('Missing stripe-signature header', {
            status: 400,
          })
        }

        let event: Stripe.Event
        try {
          event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!,
          )
        } catch {
          return new Response('Webhook signature verification failed', {
            status: 400,
          })
        }

        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object
            if (
              session.mode === 'subscription' &&
              session.customer &&
              session.subscription
            ) {
              const customerId =
                typeof session.customer === 'string'
                  ? session.customer
                  : session.customer.id
              const subscriptionId =
                typeof session.subscription === 'string'
                  ? session.subscription
                  : session.subscription.id
              await db
                .update(userTable)
                .set({
                  stripeSubscriptionId: subscriptionId,
                  stripeSubscriptionStatus: 'active',
                })
                .where(eq(userTable.stripeCustomerId, customerId))
            }
            break
          }

          case 'customer.subscription.updated': {
            const subscription = event.data.object
            const customerId =
              typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id
            await db
              .update(userTable)
              .set({ stripeSubscriptionStatus: subscription.status })
              .where(eq(userTable.stripeCustomerId, customerId))
            break
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object
            const customerId =
              typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id
            await db
              .update(userTable)
              .set({
                stripeSubscriptionId: null,
                stripeSubscriptionStatus: null,
              })
              .where(eq(userTable.stripeCustomerId, customerId))
            break
          }
        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
