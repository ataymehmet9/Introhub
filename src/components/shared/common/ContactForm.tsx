'use client'

import { forwardRef, useImperativeHandle } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import type { InsertContact } from '@/schemas'
import { Button, FormContainer, FormItem, Input } from '@/components/ui'
import { insertContactSchema } from '@/schemas'

// Zod validation schema
const contactSchema = insertContactSchema.omit({
  userId: true,
})

type ContactFormSchema = z.infer<typeof contactSchema>

interface ContactFormProps {
  initialData?: Partial<InsertContact>
  onSubmit: (data: InsertContact) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  submitText?: string
  hideActions?: boolean
}

export interface ContactFormHandle {
  submit: () => void
}

const ContactForm = forwardRef<ContactFormHandle, ContactFormProps>(
  (
    {
      initialData,
      onSubmit,
      onCancel,
      isLoading = false,
      submitText = 'Save Contact',
      hideActions = false,
    },
    ref,
  ) => {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = useForm<ContactFormSchema>({
      resolver: zodResolver(contactSchema),
      defaultValues: {
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        company: initialData?.company || '',
        position: initialData?.position || '',
        linkedinUrl: initialData?.linkedinUrl || '',
        notes: initialData?.notes || '',
      },
    })

    const handleFormSubmit = async (data: ContactFormSchema) => {
      try {
        await onSubmit(data as InsertContact)
      } catch (error) {
        console.error('Form submission error:', error)
      }
    }

    const isFormLoading = isLoading || isSubmitting

    // Expose submit method via ref
    useImperativeHandle(ref, () => ({
      submit: () => {
        handleSubmit(handleFormSubmit)()
      },
    }))

    return (
      <FormContainer>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <FormItem
            label="Name"
            invalid={!!errors.name}
            errorMessage={errors.name?.message}
          >
            <Input
              {...register('name')}
              placeholder="Enter name"
              disabled={isFormLoading}
            />
          </FormItem>

          <FormItem
            label="Email"
            invalid={!!errors.email}
            errorMessage={errors.email?.message}
          >
            <Input
              {...register('email')}
              type="email"
              placeholder="Enter email address"
              disabled={isFormLoading}
            />
          </FormItem>

          <FormItem
            label="Phone"
            invalid={!!errors.phone}
            errorMessage={errors.phone?.message}
          >
            <Input
              {...register('phone')}
              type="tel"
              placeholder="Enter phone number (optional)"
              disabled={isFormLoading}
            />
          </FormItem>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem
              label="Company"
              invalid={!!errors.company}
              errorMessage={errors.company?.message}
            >
              <Input
                {...register('company')}
                placeholder="Enter company name (optional)"
                disabled={isFormLoading}
              />
            </FormItem>

            <FormItem
              label="Position"
              invalid={!!errors.position}
              errorMessage={errors.position?.message}
            >
              <Input
                {...register('position')}
                placeholder="Enter position/role"
                disabled={isFormLoading}
              />
            </FormItem>
          </div>

          <FormItem
            label="LinkedIn Profile"
            invalid={!!errors.linkedinUrl}
            errorMessage={errors.linkedinUrl?.message}
          >
            <Input
              {...register('linkedinUrl')}
              type="url"
              placeholder="https://linkedin.com/in/username (optional)"
              disabled={isFormLoading}
            />
          </FormItem>

          <FormItem
            label="Notes"
            invalid={!!errors.notes}
            errorMessage={errors.notes?.message}
          >
            <Input
              {...register('notes')}
              textArea
              rows={4}
              placeholder="Add any additional notes (optional)"
              disabled={isFormLoading}
            />
          </FormItem>

          {!hideActions && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="default"
                onClick={onCancel}
                disabled={isFormLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="solid"
                loading={isFormLoading}
                disabled={isFormLoading}
              >
                {submitText}
              </Button>
            </div>
          )}
        </form>
      </FormContainer>
    )
  },
)

ContactForm.displayName = 'ContactForm'

export default ContactForm
