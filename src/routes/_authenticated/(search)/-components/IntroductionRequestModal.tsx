import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  TbBriefcase,
  TbBuilding,
  TbEdit,
  TbMail,
  TbSend,
  TbUser,
} from 'react-icons/tb'
import type { SearchResult } from '@/schemas'
import {
  Avatar,
  Button,
  Dialog,
  FormContainer,
  FormItem,
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

const IntroductionRequestModal = ({
  isOpen,
  onClose,
  contact,
  onSubmit,
}: IntroductionRequestModalProps) => {
  const { user } = useSessionUser()
  const [isEditing, setIsEditing] = useState(false)

  const maxChars = 1000

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
    } else if (!isOpen) {
      reset({ message: '' })
      setIsEditing(false)
    }
  }, [isOpen, defaultMessage, reset])

  const onFormSubmit = async (data: IntroductionRequestFormData) => {
    try {
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
    onClose()
  }

  if (!contact) return null

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} width={700}>
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
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {contact.name}
              </h3>
              <div className="space-y-1 mt-2">
                {contact.position && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TbBriefcase className="text-base" />
                    <span>{contact.position}</span>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TbBuilding className="text-base" />
                    <span>{contact.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <TbMail className="text-base" />
                  <span>{contact.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <TbUser className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
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
              {!isEditing ? (
                <div>
                  <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 whitespace-pre-wrap min-h-[200px]">
                    {messageValue}
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      type="button"
                      variant="plain"
                      size="sm"
                      icon={<TbEdit />}
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Message
                    </Button>
                  </div>
                </div>
              ) : (
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
            </FormItem>

            <div className="bg-info-subtle border border-info rounded-lg p-3 mb-4">
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
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              icon={<TbSend />}
              type="submit"
              disabled={isSubmitting}
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
