import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import PublicHeader from '@/components/shared/PublicHeader'
import Button from '@/components/ui/Button'

export const Route = createFileRoute('/_public/about')({
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
            Because the best opportunities usually come through people.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            IntroHub exists to make professional introductions easier to manage,
            easier to trust, and easier to act on for sales teams, partnerships
            teams, and networks built on credibility.
          </p>
        </motion.div>
      </div>

      {/* Philosophy Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, translateY: 40 }}
            whileInView={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Strong networks should be useful, not noisy.
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Too many platforms focus on visibility, volume, and superficial
              connection. IntroHub takes a different approach by helping people
              make relevant introductions with context, care, and
              accountability.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Core Values Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '🤝',
              title: 'Trust first',
              description:
                'Every introduction should feel relevant, respectful, and professionally credible.',
            },
            {
              icon: '💡',
              title: 'Clarity matters',
              description:
                'The easier it is to understand why an introduction is being made, the more likely it is to happen and lead somewhere meaningful.',
            },
            {
              icon: '📈',
              title: 'Relationships are assets',
              description:
                'The value of a network should be activated, not left hidden inside disconnected contact lists and inboxes.',
            },
          ].map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, translateY: 40 }}
              whileInView={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
            >
              <div className="text-5xl mb-4">{value.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {value.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {value.description}
              </p>
            </motion.div>
          ))}
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
              Ready to make introductions work better?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              See how IntroHub helps teams turn trusted relationships into
              repeatable growth opportunities.
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
                onClick={() => navigate({ to: '/product' })}
                size="lg"
                className="text-lg px-8 py-4"
              >
                See how it works
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
