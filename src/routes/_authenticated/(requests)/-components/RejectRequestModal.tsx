import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TbEdit, TbX } from 'react-icons/tb'
import type { IntroductionRequestWithDetails } from '../-store/requestStore'
import { Button, Dialog, FormContainer, FormItem } from '@/components/ui'
import { useSessionUser } from '@/store/authStore'

interface RejectRequestModalProps {
  isOpen: boolean
  onClose: () => void
  request: IntroductionRequestWithDetails | null
  onSubmit: (customMessage: string) => Promise<void>
}

// Zod schema for form validation
const rejectRequestFormSchema = z.object({
  customMessage: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters' })
    .max(5000, { message: 'Message must be less than 5000 characters' })
    .trim(),
})

type RejectRequestFormData = z.infer<typeof rejectRequestFormSchema>

const RejectRequestModal = ({
  isOpen,
  onClose,
  request,
  onSubmit,
}: RejectRequestModalProps) => {
  const { user } = useSessionUser()
  const [isEditing, setIsEditing] = useState(false)

  const maxChars = 5000

  // Generate default message template
  const defaultMessage = useMemo(() => {
    if (!request || !user) return ''

    return `Hi ${request.requesterName},

Thank you for your interest in connecting with ${request.targetContactName}.

Unfortunately, I'm not able to make this introduction at this time. This could be due to various reasons such as timing, relevance, or other considerations.

I appreciate your understanding and wish you the best in your networking efforts.

Best regards,
${user.name}`
  }, [request, user])

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RejectRequestFormData>({
    resolver: zodResolver(rejectRequestFormSchema),
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

  const onFormSubmit = async (data: RejectRequestFormData) => {
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
    <Dialog isOpen={isOpen} onClose={handleClose} width={700}>
      <div className="p-6 max-h-[85vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Reject Introduction Request
        </h2>

        {/* Request Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <p className="text-gray-900 dark:text-gray-100">
              <strong>From:</strong> {request.requesterName}
              {request.requesterCompany && ` (${request.requesterCompany})`}
            </p>
            <p className="text-gray-900 dark:text-gray-100">
              <strong>Wants to connect with:</strong>{' '}
              {request.targetContactName}
            </p>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 italic">
                "{request.message}"
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <FormContainer>
            <FormItem
              label="Rejection Message"
              className="mb-4"
              invalid={!!errors.customMessage}
              errorMessage={errors.customMessage?.message}
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
                    name="customMessage"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={12}
                        maxLength={maxChars}
                        placeholder="Edit the rejection message..."
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

            <div className="bg-error-subtle border border-error rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-900 dark:text-gray-100">
                <strong>Note:</strong> This will send a rejection email to{' '}
                {request.requesterName} explaining that you cannot make this
                introduction. The contact details will NOT be shared.
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
              icon={<TbX />}
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="bg-error hover:opacity-90"
            >
              Reject Request
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}

export default RejectRequestModal
