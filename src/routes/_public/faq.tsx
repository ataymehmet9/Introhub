import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { TbChevronDown } from 'react-icons/tb'
import PublicHeader from '@/components/shared/PublicHeader'

export const Route = createFileRoute('/_public/faq')({
  component: RouteComponent,
})

interface FAQItem {
  question: string
  answer: string
}

const faqData: Array<FAQItem> = [
  {
    question: 'What is IntroHub?',
    answer:
      'IntroHub is a platform for managing warm introductions across sales teams, partnerships teams, communities, and trusted professional networks.',
  },
  {
    question: 'Who is IntroHub for?',
    answer:
      'IntroHub is designed for sales leaders, AEs, SDRs, BDRs, partnership teams, community operators, investor networks, and other organizations that create value through trusted introductions.',
  },
  {
    question: 'How is IntroHub different from a CRM or contact database?',
    answer:
      'A CRM stores account and activity data, but IntroHub is focused specifically on identifying relationship paths, managing introduction requests, and coordinating the workflow around warm introductions.',
  },
  {
    question: 'Why do warm introductions matter for sales teams?',
    answer:
      'Warm introductions can create more credibility, better context, and a faster route into target accounts than cold outreach alone.',
  },
  {
    question: 'Can IntroHub support partnerships teams too?',
    answer:
      'Yes. Partnership teams can use IntroHub to turn ecosystem relationships into a more consistent source of introductions and shared opportunities with sales.',
  },
  {
    question: 'Can communities or investor networks use IntroHub?',
    answer:
      'Yes. Communities, founder networks, and investor ecosystems can use IntroHub to facilitate relevant introductions that increase member value and improve support across the network.',
  },
]

function FAQAccordion({ item, index }: { item: FAQItem; index: number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      whileInView={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white pr-4">
          {item.question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <TbChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-5 pt-2">
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            {item.answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function RouteComponent() {
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
            Frequently asked questions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Everything you need to know about IntroHub and how it helps teams
            manage warm introductions.
          </p>
        </motion.div>

        {/* FAQ Accordions */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqData.map((item, index) => (
            <FAQAccordion key={index} item={item} index={index} />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, translateY: 40 }}
          whileInView={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-20 text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl p-12 border border-blue-100 dark:border-blue-800"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            We're here to help. Book a demo to learn more about how IntroHub can
            work for your team.
          </p>
          <a
            href="/book-demo"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Book a demo
          </a>
        </motion.div>
      </div>
    </div>
  )
}

// Made with Bob
