import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import PublicHeader from '@/components/shared/PublicHeader'
import Button from '@/components/ui/Button'

export const Route = createFileRoute('/_public/solutions')({
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
            One platform, many ways to activate trusted relationships.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Whether the goal is more pipeline, stronger partnerships, better
            member value, or more strategic introductions, IntroHub gives each
            team a clear way to request, manage, and measure introductions.
          </p>
          <div className="flex items-center gap-4 justify-center">
            <Button
              variant="solid"
              onClick={() => navigate({ to: '/book-demo' })}
              size="lg"
            >
              Book a demo
            </Button>
            <Button onClick={() => navigate({ to: '/product' })} size="lg">
              See how it works
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Sales Teams Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, translateY: 40 }}
            whileInView={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <div className="text-5xl mb-6">👥</div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Sales Teams
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                IntroHub gives sales teams a scalable way to turn existing
                relationships into qualified meetings and faster pipeline
                progression.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Customers, partners, investors, teammates, and community members
                already hold paths into target accounts. IntroHub helps the team
                identify those paths, coordinate requests, and create a process
                that turns relationship access into a real revenue motion.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Instead of relying on rep memory, informal favors, or scattered
                messages, sales leaders can create a consistent intro workflow
                that improves accountability and gives the team a faster route
                to key buyers.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Scalable relationship access
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Turn informal connections into a repeatable revenue motion
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Faster pipeline progression
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Reach buyers through trusted paths instead of cold
                      outreach
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Improved accountability
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Create consistent workflows that track every introduction
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sales ICs Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, translateY: 40 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div className="order-2 lg:order-1 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Find the right door
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Discover who can open paths into target accounts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Make the ask with context
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Provide connectors with everything they need to help
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Keep intros moving
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No more chasing follow-ups across channels
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="text-5xl mb-6">💼</div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Sales ICs
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              IntroHub helps sales reps find who can open the right door, make
              the ask with context, and keep the introduction moving without
              chasing follow-ups across channels.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              The difference between a cold prospect and a warm path is often
              one relevant relationship. IntroHub helps reps uncover that path
              and act on it quickly.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              A clear introduction request gives the connector the context they
              need to help, while keeping the process efficient for the rep.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Partnerships Teams Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, translateY: 40 }}
            whileInView={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <div className="text-5xl mb-6">🤝</div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Partnerships Teams
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                IntroHub helps partnership teams convert ecosystem relationships
                into better introductions, stronger collaboration with sales,
                and more visible contribution to pipeline.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Partner relationships often create strong buying paths, but
                execution is inconsistent when requests are managed informally.
                IntroHub provides the structure needed to create more reliable
                partner-sourced opportunities.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Shared visibility helps partnership and revenue teams align
                around who should be introduced, when, and why, reducing
                friction and increasing follow-through.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Convert ecosystem relationships
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Turn partner connections into qualified opportunities
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Stronger sales collaboration
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Align partnership and revenue teams with shared visibility
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Visible pipeline contribution
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Track and measure partner-sourced opportunities
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Communities and Networks Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, translateY: 40 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div className="order-2 lg:order-1 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Thoughtful, relevant introductions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Facilitate connections that members actually value
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Structure and consistency
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Give the introduction process clear workflow
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Curated connections
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Contextual and outcome-aligned, not random or transactional
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="text-5xl mb-6">🌐</div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Communities and Networks
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              IntroHub helps community operators and private networks facilitate
              thoughtful, relevant introductions that members actually value.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Strong communities do more than host people in the same place.
              They help the right people meet at the right time for the right
              reason. IntroHub gives that process structure and consistency.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Members benefit when introductions are curated, contextual, and
              clearly aligned to an outcome instead of feeling random or
              transactional.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Investors and Founder Networks Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, translateY: 40 }}
            whileInView={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <div className="text-5xl mb-6">💡</div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Investors and Founder Networks
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                IntroHub gives investor teams, founder communities, and
                portfolio networks a more structured way to connect companies
                with the buyers, talent, advisors, and strategic relationships
                they need.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Strategic introductions are among the highest-value ways a
                network can help. IntroHub makes those requests easier to manage
                and easier to act on.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Instead of relying on ad hoc requests and fragmented follow-up,
                teams can coordinate introductions through one visible workflow.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Strategic relationship access
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Connect portfolio companies with buyers, talent, and
                      advisors
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Easier to manage and act on
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Streamline high-value introduction requests
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      One visible workflow
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Replace ad hoc requests with coordinated process
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, translateY: 40 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl p-12 border border-blue-100 dark:border-blue-800"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to activate your trusted relationships?
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
              onClick={() => navigate({ to: '/pricing' })}
              size="lg"
              className="text-lg px-8 py-4"
            >
              View pricing
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Made with Bob
