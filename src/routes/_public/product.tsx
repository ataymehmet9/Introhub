import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  TbChartBar,
  TbPencil,
  TbRefresh,
  TbSearch,
  TbSettings,
  TbUsers,
} from 'react-icons/tb'
import PublicHeader from '@/components/shared/PublicHeader'
import Button from '@/components/ui/Button'

export const Route = createFileRoute('/_public/product')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PublicHeader />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            The operating system for warm introductions.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            IntroHub gives sales teams and trusted networks a structured
            workflow to discover relationship paths, request introductions,
            coordinate outreach, and track outcomes in one place.
          </p>
          <div className="flex items-center gap-4 justify-center">
            <Button
              variant="solid"
              onClick={() => navigate({ to: '/book-demo' })}
              size="lg"
            >
              Book a demo
            </Button>
            <Button onClick={() => navigate({ to: '/solutions' })} size="lg">
              Explore solutions
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Core Features Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                Icon: TbSearch,
                title: 'Relationship discovery',
                description:
                  'Find who can credibly introduce your team into the right account or opportunity.',
              },
              {
                Icon: TbPencil,
                title: 'Structured intro requests',
                description:
                  'Standardize the ask so people know who needs the intro, why it matters, and what outcome is expected.',
              },
              {
                Icon: TbRefresh,
                title: 'Workflow coordination',
                description:
                  'Keep requests, approvals, and introductions moving without depending on memory or inbox follow-up.',
              },
              {
                Icon: TbChartBar,
                title: 'Outcome visibility',
                description:
                  'Track activity and progress so relationship-driven selling becomes measurable and improvable.',
              },
            ].map((feature, index) => {
              const Icon = feature.Icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, translateY: 40 }}
                  whileInView={{ opacity: 1, translateY: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-primary-600 dark:text-primary-400 mb-4">
                    <Icon className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Value Proposition Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, translateY: 40 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            From hidden relationships to visible opportunity.
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Most teams know valuable connections exist, but they cannot
            operationalize them. IntroHub helps uncover those relationship paths
            and turn them into clear actions that sales, partnerships, or
            network teams can actually run.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              Icon: TbUsers,
              title: 'Built around trust, context, and control.',
              description:
                'Good introductions work because they are relevant, timely, and credible. IntroHub supports that by making the request clearer, giving connectors the right context, and preserving the professionalism that makes a warm intro valuable in the first place.',
            },
            {
              Icon: TbSettings,
              title: 'Operational enough for teams, simple enough for people.',
              description:
                'The platform is designed to make introductions easier to manage without making them feel robotic. Teams get process, visibility, and accountability, while participants still experience a human, relevant introduction flow.',
            },
          ].map((benefit, index) => {
            const Icon = benefit.Icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, translateY: 40 }}
                whileInView={{ opacity: 1, translateY: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
              >
                <div className="text-primary-600 dark:text-primary-400 mb-4">
                  <Icon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {benefit.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, translateY: 40 }}
            whileInView={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl p-12 border border-blue-100 dark:border-blue-800"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Turn relationships into repeatable growth.
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              See how IntroHub helps your team discover relationship paths,
              coordinate introductions, and track outcomes in one place.
            </p>
            <div className="flex items-center gap-4 justify-center">
              <Button
                variant="solid"
                onClick={() => navigate({ to: '/book-demo' })}
                size="lg"
                className="text-lg px-8 py-4"
              >
                Book a demo
              </Button>
              <Button
                onClick={() => navigate({ to: '/solutions' })}
                size="lg"
                className="text-lg px-8 py-4"
              >
                Explore solutions
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
