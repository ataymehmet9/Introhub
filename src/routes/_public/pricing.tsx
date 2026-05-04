import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import PublicHeader from '@/components/shared/PublicHeader'
import Button from '@/components/ui/Button'

export const Route = createFileRoute('/_public/pricing')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Starter',
      price: '$0',
      period: 'forever',
      description:
        'For smaller teams and curated networks getting introduction workflows out of inboxes and into one system.',
      features: [
        'Unlimited contacts',
        '5 introduction requests per month',
        'Basic analytics',
        'Email support',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Growth',
      price: '$99',
      period: 'per month',
      description:
        'For scaling sales, partnership, and community teams that need more visibility, coordination, and reporting.',
      features: [
        'Unlimited contacts',
        'Unlimited introduction requests',
        'Advanced analytics & insights',
        'Priority email support',
        'Custom branding',
        'API access',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description:
        'For larger organizations and multi-team environments that need advanced permissions, rollout support, and tailored implementation.',
      features: [
        'Everything in Growth',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee',
        'Advanced security features',
        'Training & onboarding',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Pricing that scales with your network, not your admin load.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            IntroHub plans are designed for teams and networks that want to
            create more value from warm introductions, with the workflow clarity
            and visibility needed to scale confidently.
          </p>
          <Button
            variant="solid"
            onClick={() => navigate({ to: '/book-demo' })}
          >
            Book a demo
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, translateY: 40 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl scale-105'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-2xl font-bold mb-2 ${
                    plan.highlighted
                      ? 'text-white'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm ${
                    plan.highlighted
                      ? 'text-blue-100'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span
                  className={`text-5xl font-bold ${
                    plan.highlighted
                      ? 'text-white'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`text-sm ml-2 ${
                    plan.highlighted
                      ? 'text-blue-100'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span
                      className={`text-xl ${
                        plan.highlighted ? 'text-blue-200' : 'text-green-500'
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={`text-sm ${
                        plan.highlighted
                          ? 'text-blue-50'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? 'solid' : 'default'}
                className={`w-full ${
                  plan.highlighted
                    ? 'bg-white text-blue-600 hover:bg-gray-100'
                    : ''
                }`}
                onClick={() => navigate({ to: '/signup' })}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Why teams choose IntroHub pricing
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-4 text-lg text-gray-700 dark:text-gray-300">
              <span className="text-2xl text-green-500 flex-shrink-0">✓</span>
              <span>
                Designed for privacy, professionalism, and trust-based
                workflows.
              </span>
            </li>
            <li className="flex items-start gap-4 text-lg text-gray-700 dark:text-gray-300">
              <span className="text-2xl text-green-500 flex-shrink-0">✓</span>
              <span>
                Built to support repeatable introductions without losing the
                human element.
              </span>
            </li>
            <li className="flex items-start gap-4 text-lg text-gray-700 dark:text-gray-300">
              <span className="text-2xl text-green-500 flex-shrink-0">✓</span>
              <span>
                Suitable for sales, partnerships, and member-driven network
                models.
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
