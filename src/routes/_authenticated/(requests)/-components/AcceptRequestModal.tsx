import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TbCheck, TbEdit, TbMail } from 'react-icons/tb'
import type { IntroductionRequestWithDetails } from '../-store/requestStore'
import { Button, Dialog, FormContainer, FormItem } from '@/components/ui'
import { useSessionUser } from '@/store/authStore'

interface AcceptRequestModalProps {
  isOpen: boolean
  onClose: () => void
  request: IntroductionRequestWithDetails | null
  onSubmit: (customMessage: string) => Promise<void>
}

// Zod schema for form validation
const acceptRequestFormSchema = z.object({
  customMessage: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters' })
    .max(5000, { message: 'Message must be less than 5000 characters' })
    .trim(),
})

type AcceptRequestFormData = z.infer<typeof acceptRequestFormSchema>

const AcceptRequestModal = ({
  isOpen,
  onClose,
  request,
  onSubmit,
}: AcceptRequestModalProps) => {
  const { user } = useSessionUser()
  const [isEditing, setIsEditing] = useState(false)

  const maxChars = 5000

  // Generate default message template
  const defaultMessage = useMemo(() => {
    if (!request || !user) return ''

    return `I think you both would benefit from connecting!

${request.targetContactName} has expertise in ${request.targetContactCompany ? `their work at ${request.targetContactCompany}` : 'their field'}, and ${request.requesterName} is interested in learning more.

Feel free to take it from here and connect directly.`
  }, [request, user])

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AcceptRequestFormData>({
    resolver: zodResolver(acceptRequestFormSchema),
    defaultValues: {
      customMessage: '',
    },
    mode: 'onChange',
  })

  // Watch message field for character count
  const messageValue = watch('customMessage')
  const remainingChars = maxChars - (messageValue.length || 0)

  // Reset form with default message when modal opens
  useEffect(() => {
    if (isOpen && defaultMessage) {
      reset({ customMessage: defaultMessage })
      setIsEditing(false)
    } else if (!isOpen) {
      reset({ customMessage: '' })
      setIsEditing(false)
    }
  }, [isOpen, defaultMessage, reset])

  const onFormSubmit = async (data: AcceptRequestFormData) => {
    try {
      await onSubmit(data.customMessage)
      reset()
      onClose()
    } catch {
      // Error is handled in the hook
    }
  }

  const handleClose = () => {
    reset()
    setIsEditing(false)
    onClose()
  }

  if (!request) return null

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} width={800}>
      <div className="p-6 max-h-[85vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Accept Introduction Request
        </h2>

        {/* Email Preview */}
        <div className="bg-info-subtle border border-info rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <TbMail className="text-info text-xl mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Email Recipients:
              </p>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <strong>TO:</strong> {request.targetContactName} (
                  {request.targetContactEmail})
                </p>
                <p>
                  <strong>CC:</strong> {request.requesterName} (
                  {request.requesterEmail})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Template Preview */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
            Email Template Preview
          </p>
          <div className="space-y-3 text-sm">
            <p className="text-gray-900 dark:text-gray-100">
              <strong>Subject:</strong> Introduction: {request.requesterName}{' '}
              {'<>'} {request.targetContactName}
            </p>
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-2">
                Hi {request.targetContactName} and {request.requesterName},
              </p>
              <p className="mb-2">I'd like to introduce you both!</p>
              <div className="bg-white dark:bg-gray-900 rounded p-3 mb-2">
                <p className="font-semibold">{request.targetContactName}</p>
                {request.targetContactPosition &&
                  request.targetContactCompany && (
                    <p className="text-xs">
                      {request.targetContactPosition} at{' '}
                      {request.targetContactCompany}
                    </p>
                  )}
                <p className="text-xs text-primary">
                  {request.targetContactEmail}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded p-3 mb-2">
                <p className="font-semibold">{request.requesterName}</p>
                {request.requesterCompany && (
                  <p className="text-xs">at {request.requesterCompany}</p>
                )}
                <p className="text-xs text-primary">{request.requesterEmail}</p>
              </div>
              <p className="italic text-gray-600 dark:text-gray-400">
                [Your custom message will appear here]
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <FormContainer>
            <FormItem
              label="Your Introduction Message"
              className="mb-4"
              invalid={!!errors.customMessage}
              errorMessage={errors.customMessage?.message}
            >
              {!isEditing ? (
                <div>
                  <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 whitespace-pre-wrap min-h-[150px]">
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
                    name="customMessage"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={8}
                        maxLength={maxChars}
                        placeholder="Add your personal introduction message..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100 resize-none"
                        autoFocus
                      />
                    )}
                  />
                  <span
                    className={`text-xs text-right block mt-2 ${
                      remainingChars < 500
                        ? 'text-error'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {remainingChars} characters remaining
                  </span>
                </div>
              )}
            </FormItem>

            <div className="bg-success-subtle border border-success rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-900 dark:text-gray-100">
                <strong>Note:</strong> This will send an introduction email to
                both {request.targetContactName} (TO) and{' '}
                {request.requesterName} (CC), introducing them to each other
                with their contact details.
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
              icon={<TbCheck />}
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Accept & Send Introduction
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}

export default AcceptRequestModal
