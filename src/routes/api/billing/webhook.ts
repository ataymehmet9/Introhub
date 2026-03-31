import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import { stripe } from '@/integrations/stripe/init'
import { db } from '@/db'
import { notifications, user as userTable } from '@/db/schema'
import { downgradeToFree, upgradeToPro } from '@/services/subscription.service'

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

              // Get user ID from customer
              const users = await db
                .select({ id: userTable.id })
                .from(userTable)
                .where(eq(userTable.stripeCustomerId, customerId))
                .limit(1)

              if (users.length > 0) {
                // Upgrade user to Pro
                await upgradeToPro(users[0].id, subscriptionId)

                // Send success notification
                await db.insert(notifications).values({
                  userId: users[0].id,
                  type: 'unknown',
                  title: 'Welcome to Pro!',
                  message:
                    "You're now on the Pro plan with unlimited introduction requests. Thank you for subscribing!",
                  read: false,
                })
              }
            }
            break
          }

          case 'customer.subscription.updated': {
            const subscription = event.data.object
            const customerId =
              typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id

            // Update subscription status
            await db
              .update(userTable)
              .set({ stripeSubscriptionStatus: subscription.status })
              .where(eq(userTable.stripeCustomerId, customerId))

            // Handle status changes
            if (subscription.status === 'past_due') {
              const users = await db
                .select({ id: userTable.id })
                .from(userTable)
                .where(eq(userTable.stripeCustomerId, customerId))
                .limit(1)

              if (users.length > 0) {
                await db.insert(notifications).values({
                  userId: users[0].id,
                  type: 'unknown',
                  title: 'Payment Failed',
                  message:
                    "We couldn't process your payment. Please update your payment method to continue your Pro subscription.",
                  read: false,
                })
              }
            }
            break
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object
            const customerId =
              typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id

            // Get user ID
            const users = await db
              .select({ id: userTable.id })
              .from(userTable)
              .where(eq(userTable.stripeCustomerId, customerId))
              .limit(1)

            if (users.length > 0) {
              // Downgrade user to Free
              await downgradeToFree(users[0].id)

              // Send downgrade notification
              await db.insert(notifications).values({
                userId: users[0].id,
                type: 'unknown',
                title: 'Subscription Canceled',
                message:
                  'Your Pro subscription has been canceled. You now have 5 introduction requests per month on the Free plan.',
                read: false,
              })
            }
            break
          }

          case 'invoice.payment_failed': {
            const invoice = event.data.object
            const customerId =
              typeof invoice.customer === 'string'
                ? invoice.customer
                : invoice.customer?.id

            if (customerId) {
              const users = await db
                .select({ id: userTable.id })
                .from(userTable)
                .where(eq(userTable.stripeCustomerId, customerId))
                .limit(1)

              if (users.length > 0) {
                await db.insert(notifications).values({
                  userId: users[0].id,
                  type: 'unknown',
                  title: 'Payment Failed',
                  message:
                    'Your payment failed. Please update your payment method to avoid service interruption.',
                  read: false,
                })
              }
            }
            break
          }

          case 'invoice.payment_succeeded': {
            const invoice = event.data.object
            const customerId =
              typeof invoice.customer === 'string'
                ? invoice.customer
                : invoice.customer?.id

            if (customerId) {
              // Ensure subscription is active
              await db
                .update(userTable)
                .set({ stripeSubscriptionStatus: 'active' })
                .where(eq(userTable.stripeCustomerId, customerId))
            }
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
