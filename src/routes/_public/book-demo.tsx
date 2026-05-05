import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ZodError } from 'zod'
import type { DemoRequestForm } from '@/schemas'
import PublicHeader from '@/components/shared/PublicHeader'
import Button from '@/components/ui/Button'
import { submitDemoRequest } from '@/services/demo-request.functions'

export const Route = createFileRoute('/_public/book-demo')({
  component: RouteComponent,
})

function RouteComponent() {
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    website: '', // Honeypot field
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const statusMessageRef = useRef<HTMLDivElement | null>(null)

  const MESSAGE_MAX_LENGTH = 1000
  const messageCharsRemaining = MESSAGE_MAX_LENGTH - formData.message.length

  // Load reCAPTCHA on mount
  useEffect(() => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
    if (!siteKey) {
      console.error('reCAPTCHA site key not configured')
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      `script[src*="recaptcha/api.js"]`,
    )
    if (existingScript) {
      setRecaptchaLoaded(true)
      return
    }

    // Load script
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    script.onload = () => setRecaptchaLoaded(true)
    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script')
      setRecaptchaLoaded(false)
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  useEffect(() => {
    if (!submitStatus.type) {
      return
    }

    statusMessageRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [submitStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })
    setFieldErrors({})

    try {
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
      if (!siteKey) {
        throw new Error('reCAPTCHA not configured')
      }

      // Check if reCAPTCHA is loaded
      if (!recaptchaLoaded || !window.grecaptcha) {
        throw new Error('reCAPTCHA not loaded. Please refresh the page.')
      }

      // Get reCAPTCHA token
      const token = await new Promise<string>((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(siteKey, { action: 'submit_demo_request' })
            .then(resolve)
            .catch(reject)
        })
      })

      // Submit form with token
      const requestData: DemoRequestForm = {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        message: formData.message,
        website: formData.website,
        recaptchaToken: token,
      }

      const result = await submitDemoRequest({ data: requestData })

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.message,
        })
        // Reset form
        setFormData({
          name: '',
          email: '',
          company: '',
          message: '',
          website: '',
        })
      } else {
        // Parse error message if it's JSON
        let errorMessage = result.message
        try {
          const parsedError = JSON.parse(result.message)
          if (parsedError.message) {
            errorMessage = parsedError.message
          }
        } catch {
          // Not JSON, use as-is
        }

        setSubmitStatus({
          type: 'error',
          message: errorMessage,
        })
      }
    } catch (error) {
      console.error('Error submitting demo request:', error)

      let errorMessage = 'An error occurred. Please try again.'

      if (error instanceof ZodError) {
        // Handle Zod validation errors
        const errors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message
          }
        })
        setFieldErrors(errors)
        errorMessage = 'Please fix the errors in the form.'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      setSubmitStatus({
        type: 'error',
        message: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    // Enforce max length for message field
    if (name === 'message' && value.length > MESSAGE_MAX_LENGTH) {
      return
    }

    setFormData({
      ...formData,
      [name]: value,
    })
  }

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
            Book a Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            See IntroHub in action. Schedule a personalized demo with our team.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, translateX: -40 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* reCAPTCHA Loading Status */}
              {!recaptchaLoaded && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                  Loading security verification...
                </div>
              )}

              {/* Status Messages */}
              {submitStatus.type && (
                <div
                  ref={statusMessageRef}
                  className={`p-4 rounded-lg ${
                    submitStatus.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {submitStatus.message}
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    fieldErrors.name
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
                  placeholder="John Doe"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Work Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    fieldErrors.email
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
                  placeholder="john@company.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Company Name *
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    fieldErrors.company
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
                  placeholder="Acme Inc."
                />
                {fieldErrors.company && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.company}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Tell us about your needs
                  </label>
                  <span
                    className={`text-xs ${
                      messageCharsRemaining < 100
                        ? 'text-orange-600 dark:text-orange-400 font-medium'
                        : messageCharsRemaining < 0
                          ? 'text-red-600 dark:text-red-400 font-bold'
                          : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {messageCharsRemaining} characters remaining
                  </span>
                </div>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  maxLength={MESSAGE_MAX_LENGTH}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    fieldErrors.message
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none`}
                  placeholder="What are you looking to achieve with IntroHub?"
                />
                {fieldErrors.message && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              {/* Honeypot field - hidden from users */}
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  width: '1px',
                  height: '1px',
                }}
                aria-hidden="true"
              />

              <Button
                type="submit"
                variant="solid"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !recaptchaLoaded}
              >
                {isSubmitting
                  ? 'Submitting...'
                  : !recaptchaLoaded
                    ? 'Loading...'
                    : 'Request Demo'}
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                This site is protected by reCAPTCHA and the Google{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  href="https://policies.google.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Terms of Service
                </a>{' '}
                apply.
              </p>
            </form>
          </motion.div>

          {/* What to Expect */}
          <motion.div
            initial={{ opacity: 0, translateX: 40 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              What to Expect
            </h2>
            <div className="space-y-6">
              {[
                {
                  number: '1',
                  title: 'Schedule Your Demo',
                  description:
                    "We'll reach out within 24 hours to schedule a time that works for you.",
                },
                {
                  number: '2',
                  title: 'Personalized Walkthrough',
                  description:
                    'Our team will show you how IntroHub can solve your specific networking challenges.',
                },
                {
                  number: '3',
                  title: 'Q&A Session',
                  description:
                    'Ask any questions and learn about pricing, implementation, and best practices.',
                },
                {
                  number: '4',
                  title: 'Get Started',
                  description:
                    "If it's a good fit, we'll help you get set up and onboard your team.",
                },
              ].map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// TypeScript declaration for grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

// Made with Bob
