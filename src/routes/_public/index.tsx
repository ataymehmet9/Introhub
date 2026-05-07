import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  TbBolt,
  TbBriefcase,
  TbBulb,
  TbChartBar,
  TbDoorEnter,
  TbEye,
  TbMail,
  TbPencil,
  TbRefresh,
  TbSearch,
  TbTrendingUp,
  TbUsers,
  TbWorld,
} from 'react-icons/tb'
import Button from '@/components/ui/Button'
import PublicHeader from '@/components/shared/PublicHeader'

export const Route = createFileRoute('/_public/')({
  component: RouteComponent,
})

const TextGenerateEffect = ({
  words,
  wordClassName,
  wordsCallbackClass,
}: {
  words: string
  wordClassName?: string
  wordsCallbackClass?: (payload: { word: string }) => string
}) => {
  const wordsArray = words.split(' ')

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 40 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.5 }}
      className={wordClassName}
    >
      <h1>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: idx * 0.075 }}
            className={wordsCallbackClass?.({ word }) || ''}
          >
            {word}{' '}
          </motion.span>
        ))}
      </h1>
    </motion.div>
  )
}

function RouteComponent() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PublicHeader />
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 flex min-h-screen flex-col items-center justify-between">
        <div className="flex flex-col min-h-screen pt-20 md:pt-40 relative overflow-hidden">
          <div>
            <TextGenerateEffect
              wordClassName="text-2xl md:text-4xl lg:text-7xl font-bold max-w-7xl mx-auto text-center mt-6 relative z-10"
              words="Turn existing relationships into warm introductions, qualified meetings, and faster pipeline."
              wordsCallbackClass={({ word }) => {
                if (
                  [
                    'warm',
                    'introductions,',
                    'qualified',
                    'meetings,',
                    'faster',
                    'pipeline.',
                  ].includes(word)
                ) {
                  return 'bg-gradient-to-r from-[#2feaa8] to-[#0eb9ce] bg-clip-text text-transparent'
                }

                return 'text-gray-900 dark:text-white'
              }}
            />
            <motion.p
              initial={{ opacity: 0, translateY: 40 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="text-center mt-6 text-base md:text-xl text-gray-600 dark:text-gray-400 max-w-5xl mx-auto relative z-10 font-normal"
            >
              IntroHub helps sales teams, sales reps, partnerships teams,
              communities, and investor networks find the right path into target
              accounts, request introductions with context, and track every
              intro from ask to outcome.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, translateY: 40 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="flex items-center gap-4 justify-center mt-10 relative z-10"
            >
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
            </motion.div>
          </div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, translateY: 60 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="p-2 lg:p-4 border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-700 rounded-2xl lg:rounded-[32px] mt-20 relative"
          >
            <div className="absolute inset-x-0 bottom-0 h-40 w-full bg-gradient-to-b from-transparent via-white to-white dark:via-gray-900 dark:to-gray-900 scale-[1.1] pointer-events-none" />
            <div className="bg-white dark:bg-gray-800 dark:border-gray-700 border border-gray-200 rounded-[24px] overflow-hidden">
              {/* Dashboard Preview Content */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center">
                      <span className="text-white dark:text-gray-900 font-bold text-lg">
                        IH
                      </span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      IntroHub
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Overview
                    </span>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        Total Contacts
                      </span>
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400">
                          👥
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      247
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      +12% from last month
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Total order
                      </span>
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400">
                          📨
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      7,234
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                      -2.8% from last month
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                        Impression
                      </span>
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                        <span className="text-purple-600 dark:text-purple-400">
                          👁️
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      3.1M
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      +4.6% from last month
                    </div>
                  </div>
                </div>

                {/* Chart Area Placeholder */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      EM
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        Sales target
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent"></div>
                        <span className="text-sm font-semibold text-blue-500">
                          75%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg relative overflow-hidden">
                    <svg
                      className="absolute bottom-0 w-full h-full"
                      viewBox="0 0 400 100"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0,50 Q100,20 200,40 T400,30"
                        fill="none"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="3"
                      />
                    </svg>
                  </div>
                </div>

                {/* Top Product Section */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Top product
                    </h3>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      View all
                    </button>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        Maneki Neko Poster
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Sold: 1249
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      +16.2%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Key Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, translateY: 40 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Built for teams that grow through relationships, not guesswork.
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Ideal for sales teams, partnerships leaders, private communities,
            membership networks, and founder ecosystems that rely on trusted
            access to create opportunity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              Icon: TbDoorEnter,
              title: 'Open doors into accounts',
              description:
                'Open doors into accounts that ignore cold outreach.',
            },
            {
              Icon: TbRefresh,
              title: 'Clear workflow',
              description:
                'Replace scattered intro requests with one clear workflow.',
            },
            {
              Icon: TbEye,
              title: 'Full visibility',
              description:
                'Give teams visibility into which introductions are pending, sent, accepted, and progressing.',
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
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
              >
                <div className="text-primary-600 dark:text-primary-400 mb-4">
                  <Icon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
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

      {/* Process Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, translateY: 40 }}
            whileInView={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              A better way to activate the right relationship.
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              IntroHub gives revenue teams and trusted networks a clear workflow
              for finding warm paths, making better asks, coordinating
              introductions, and tracking what happens next.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                Icon: TbSearch,
                title: 'Find the right path',
                description:
                  'Identify who can credibly open the door based on account relevance, relationship context, industry, or shared trust.',
              },
              {
                Icon: TbPencil,
                title: 'Make a better ask',
                description:
                  'Submit a structured introduction request with the context a connector needs to act quickly and confidently.',
              },
              {
                Icon: TbMail,
                title: 'Send the intro',
                description:
                  'Coordinate a warm introduction without rewriting the process every time or losing details across channels.',
              },
              {
                Icon: TbChartBar,
                title: 'Track what happened',
                description:
                  'See which intros were sent, accepted, responded to, and progressed so the team can measure what is working.',
              },
            ].map((step, index) => {
              const Icon = step.Icon
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
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Why Teams Choose Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, translateY: 40 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Why teams choose IntroHub.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              Icon: TbTrendingUp,
              title: 'More pipeline from warm paths',
              description:
                'Create more opportunities by reaching buyers through trusted relationships instead of relying only on cold outbound.',
            },
            {
              Icon: TbBolt,
              title: 'Less friction for reps and connectors',
              description:
                'Make it easier for both sides to participate with clearer requests, cleaner workflows, and better context.',
            },
            {
              Icon: TbUsers,
              title: 'Better cross-functional collaboration',
              description:
                'Bring sales, partnerships, communities, and network operators into one shared introduction workflow.',
            },
            {
              Icon: TbChartBar,
              title: 'Measurable relationship value',
              description:
                'Track activity and outcomes so introductions become an accountable growth motion rather than an informal side process.',
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

      {/* Use Cases Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, translateY: 40 }}
            whileInView={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Designed for every team that grows through trusted access.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                Icon: TbUsers,
                title: 'Sales Teams',
                description:
                  'Help reps identify warm paths into target accounts and create a repeatable intro motion across the team.',
              },
              {
                Icon: TbBriefcase,
                title: 'Sales ICs',
                description:
                  'Give AEs, SDRs, and BDRs a faster route to the right buyer through people who already have credibility.',
              },
              {
                Icon: TbUsers,
                title: 'Partnerships Teams',
                description:
                  'Turn ecosystem relationships into more visible lead flow, shared opportunities, and stronger collaboration with sales.',
              },
              {
                Icon: TbWorld,
                title: 'Communities and Networks',
                description:
                  'Create more member value by facilitating high-relevance introductions at scale.',
              },
              {
                Icon: TbBulb,
                title: 'Investors and Founder Networks',
                description:
                  'Support portfolio and network companies with timely access to buyers, advisors, talent, and strategic relationships.',
              },
            ].map((useCase, index) => {
              const Icon = useCase.Icon
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
                    {useCase.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {useCase.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
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
            If relationships already drive opportunity, they deserve a system.
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            See how IntroHub helps your team turn warm introductions into a
            repeatable growth channel.
          </p>
          <Button
            variant="solid"
            onClick={() => navigate({ to: '/book-demo' })}
            size="lg"
            className="text-lg px-8 py-4"
          >
            Book a demo
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
