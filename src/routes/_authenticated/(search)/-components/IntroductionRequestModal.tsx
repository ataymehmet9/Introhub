import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from '@tanstack/react-router'
import { usePostHog } from '@posthog/react'
import {
  TbBriefcase,
  TbBuilding,
  TbCheck,
  TbEdit,
  TbFileText,
  TbLoader,
  TbLock,
  TbMail,
  TbRefresh,
  TbSend,
  TbSparkles,
  TbUser,
} from 'react-icons/tb'
import { useAIGeneration } from '../-hooks/useAIGeneration'
import type { SearchResult } from '@/schemas'
import {
  Avatar,
  Button,
  Dialog,
  FormContainer,
  FormItem,
  Spinner,
} from '@/components/ui'
import { stringToColor } from '@/utils/colours'
import { useSessionUser } from '@/store/authStore'

interface IntroductionRequestModalProps {
  isOpen: boolean
  onClose: () => void
  contact: SearchResult | null
  onSubmit: (message: string) => Promise<void>
}

// Zod schema for form validation
const introductionRequestFormSchema = z.object({
  message: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters' })
    .max(1000, { message: 'Message must be less than 1000 characters' })
    .trim(),
})

type IntroductionRequestFormData = z.infer<typeof introductionRequestFormSchema>

type ViewMode = 'single' | 'comparison'
type MessageType = 'template' | 'ai'

const IntroductionRequestModal = ({
  isOpen,
  onClose,
  contact,
  onSubmit,
}: IntroductionRequestModalProps) => {
  const { user } = useSessionUser()
  const posthog = usePostHog()
  const [isEditing, setIsEditing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('single')
  const [selectedMessage, setSelectedMessage] =
    useState<MessageType>('template')
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false)
  const [previousMessages, setPreviousMessages] = useState<Array<string>>([])

  const maxChars = 1000

  // AI Generation hook
  const { generateAIMessage, isGenerating, isPro, rateLimit } = useAIGeneration(
    {
      onSuccess: (message) => {
        // Add current AI message to previous messages for future regenerations
        setPreviousMessages((prev) => [...prev, message])
        setAiMessage(message)
        setSelectedMessage('ai')
        setViewMode('comparison')
        setHasGeneratedOnce(true)
      },
    },
  )

  // Generate default message template
  const defaultMessage = useMemo(() => {
    if (!contact || !user) return ''

    const userWithDetails = user as typeof user & {
      company?: string | null
      position?: string | null
    }

    return `Hi ${contact.ownerName},

I'm ${user.name || '[Your Name]'}${userWithDetails.company ? ` from ${userWithDetails.company}` : ''}${userWithDetails.position ? `, working as ${userWithDetails.position}` : ''}.

I would like to request an introduction to ${contact.name}${contact.company ? ` at ${contact.company}` : ''}.

Thank you for considering my request!

Best regards,
${user.name || '[Your Name]'}`
  }, [contact, user])

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IntroductionRequestFormData>({
    resolver: zodResolver(introductionRequestFormSchema),
    defaultValues: {
      message: '',
    },
    mode: 'onChange',
  })

  // Watch message field for character count
  const messageValue = watch('message')
  const remainingChars = maxChars - (messageValue.length || 0)

  // Reset form with default message when modal opens, clear when it closes
  useEffect(() => {
    if (isOpen && defaultMessage) {
      reset({ message: defaultMessage })
      setIsEditing(false)
      setViewMode('single')
      setSelectedMessage('template')
      setAiMessage(null)
      setHasGeneratedOnce(false)
      setPreviousMessages([])
    } else if (!isOpen) {
      reset({ message: '' })
      setIsEditing(false)
      setViewMode('single')
      setSelectedMessage('template')
      setAiMessage(null)
      setHasGeneratedOnce(false)
      setPreviousMessages([])
    }
  }, [isOpen, defaultMessage, reset])

  const onFormSubmit = async (data: IntroductionRequestFormData) => {
    try {
      // Track which message type was sent
      posthog.capture('introduction_sent', {
        contactId: contact?.id,
        usedAI: selectedMessage === 'ai' && aiMessage !== null,
        messageEdited:
          data.message !==
          (selectedMessage === 'ai' ? aiMessage : defaultMessage),
      })

      await onSubmit(data.message)
    } catch {
      // Error is handled in the hook
    } finally {
      reset()
      onClose()
    }
  }

  const handleClose = () => {
    reset()
    setIsEditing(false)
    setViewMode('single')
    setSelectedMessage('template')
    setAiMessage(null)
    setHasGeneratedOnce(false)
    setPreviousMessages([])
    onClose()
  }

  const handleEnhanceWithAI = () => {
    if (contact?.id) {
      generateAIMessage(contact.id, false)
    }
  }

  const handleRegenerate = () => {
    if (contact?.id) {
      // Pass previous messages to avoid repetition
      generateAIMessage(contact.id, true, previousMessages)
    }
  }

  const handleMessageSelect = (type: MessageType) => {
    setSelectedMessage(type)
    posthog.capture(
      type === 'ai' ? 'ai_message_selected' : 'template_selected',
      {
        contactId: contact?.id,
      },
    )
  }

  const handleContinue = () => {
    const message = selectedMessage === 'ai' ? aiMessage : defaultMessage
    if (message) {
      setValue('message', message)
      setViewMode('single')
      setIsEditing(false)
    }
  }

  if (!contact) return null

  // Calculate remaining generations for display
  const remainingGenerations = rateLimit?.remaining ?? 0
  const isRateLimited = rateLimit ? rateLimit.remaining <= 0 : false

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      width={viewMode === 'comparison' ? 900 : 700}
    >
      <div className="p-6 max-h-[85vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Request Introduction
        </h2>

        {/* Contact Information Card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-4">
            <Avatar
              size={60}
              shape="circle"
              style={{ backgroundColor: stringToColor(contact.name) }}
              className="text-white font-semibold text-xl flex-shrink-0 p-4"
            >
              {contact.name.charAt(0) || 'U'}
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {contact.name}
              </h3>
              <div className="space-y-1 mt-2">
                {contact.position && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TbBriefcase className="text-base flex-shrink-0 mt-0.5" />
                    <span className="break-words">{contact.position}</span>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TbBuilding className="text-base flex-shrink-0 mt-0.5" />
                    <span className="break-words">{contact.company}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <TbMail className="text-base flex-shrink-0 mt-0.5" />
                  <span className="break-all">{contact.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2">
              <TbUser className="text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600 dark:text-gray-400 break-words">
                This contact belongs to{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {contact.ownerName}
                </span>
                {contact.ownerCompany && (
                  <span> at {contact.ownerCompany}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <FormContainer>
            <FormItem
              label="Your Message"
              className="mb-4"
              invalid={!!errors.message}
              errorMessage={errors.message?.message}
            >
              {viewMode === 'single' ? (
                // Single message view
                <div>
                  {isGenerating ? (
                    // Loading state
                    <div className="relative w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 min-h-[200px] flex items-center justify-center">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Spinner size={40} className="mb-3 mx-auto" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Generating personalized message...
                        </p>
                      </div>
                    </div>
                  ) : !isEditing ? (
                    // View mode
                    <div>
                      <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 whitespace-pre-wrap min-h-[200px]">
                        {messageValue}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 mb-6 gap-2">
                        {/* Enhance with AI button */}
                        {!hasGeneratedOnce && (
                          <div className="w-full sm:w-auto">
                            {isPro ? (
                              <Button
                                type="button"
                                variant="solid"
                                size="sm"
                                icon={<TbSparkles className="text-lg" />}
                                onClick={handleEnhanceWithAI}
                                disabled={isRateLimited}
                                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                              >
                                Enhance with AI
                                {rateLimit && (
                                  <span className="ml-1.5 text-xs opacity-90">
                                    ({remainingGenerations}/10)
                                  </span>
                                )}
                              </Button>
                            ) : (
                              <Link
                                to="/me/billing"
                                className="block w-full sm:w-auto"
                              >
                                <Button
                                  type="button"
                                  variant="solid"
                                  size="sm"
                                  icon={<TbSparkles className="text-lg" />}
                                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                                >
                                  <span className="flex items-center gap-1.5">
                                    Enhance with AI
                                    <TbLock className="text-sm" />
                                    <span className="text-xs opacity-90">
                                      (Pro)
                                    </span>
                                  </span>
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="plain"
                          size="sm"
                          icon={<TbEdit />}
                          onClick={() => setIsEditing(true)}
                          className="w-full sm:w-auto"
                        >
                          Edit Message
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Edit mode
                    <div>
                      <Controller
                        name="message"
                        control={control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            rows={12}
                            maxLength={maxChars}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100 resize-none"
                            autoFocus
                          />
                        )}
                      />
                      <span
                        className={`text-xs text-right block mt-2 ${
                          remainingChars < 100
                            ? 'text-error'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {remainingChars} characters remaining
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // Comparison view
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* AI Message Card (shown first on mobile) */}
                    <div
                      className={`order-1 md:order-2 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedMessage === 'ai'
                          ? 'border-primary bg-primary-subtle'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      onClick={() => handleMessageSelect('ai')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TbSparkles className="text-primary" />
                          <span className="font-semibold text-sm">
                            AI Generated
                          </span>
                        </div>
                        {selectedMessage === 'ai' && (
                          <div className="flex items-center gap-1 text-primary text-sm">
                            <TbCheck />
                            <span>Selected</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                        {aiMessage}
                      </div>
                    </div>

                    {/* Template Message Card */}
                    <div
                      className={`order-2 md:order-1 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedMessage === 'template'
                          ? 'border-primary bg-primary-subtle'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      onClick={() => handleMessageSelect('template')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TbFileText className="text-gray-600 dark:text-gray-400" />
                          <span className="font-semibold text-sm">
                            Template
                          </span>
                        </div>
                        {selectedMessage === 'template' && (
                          <div className="flex items-center gap-1 text-primary text-sm">
                            <TbCheck />
                            <span>Selected</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                        {defaultMessage}
                      </div>
                    </div>
                  </div>

                  {/* Comparison view actions */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <Button
                      type="button"
                      variant="solid"
                      size="sm"
                      icon={
                        isGenerating ? (
                          <TbLoader className="animate-spin text-lg" />
                        ) : (
                          <TbRefresh className="text-lg" />
                        )
                      }
                      onClick={handleRegenerate}
                      disabled={isGenerating || isRateLimited}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      Regenerate
                      {rateLimit && !isGenerating && (
                        <span className="ml-1.5 text-xs opacity-90">
                          ({remainingGenerations}/10)
                        </span>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="solid"
                      size="sm"
                      onClick={handleContinue}
                      className="w-full sm:w-auto"
                    >
                      Continue with Selected
                    </Button>
                  </div>
                </div>
              )}
            </FormItem>

            <div className="bg-info-subtle border border-info rounded-lg p-3 mb-6 mt-6">
              <p className="text-xs text-gray-900 dark:text-gray-100">
                <strong>Note:</strong> This message will be sent to{' '}
                {contact.ownerName}, who can then decide whether to introduce
                you to {contact.name}.
              </p>
            </div>
          </FormContainer>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isSubmitting || isGenerating}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              icon={<TbSend />}
              type="submit"
              disabled={
                isSubmitting || isGenerating || viewMode === 'comparison'
              }
              loading={isSubmitting}
            >
              Send Request
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}

export default IntroductionRequestModal

// Made with Bob
