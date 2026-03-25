import { useRef, useState } from 'react'
import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Form,
  FormItem,
  Input,
  Notification,
  toast,
} from '@/components/ui'
import { ConfirmDialog } from '@/components/shared'
import { authClient } from '@/lib/auth-client'

const validationSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
    newPassword: z
      .string()
      .min(8, { message: 'New password must be at least 8 characters' }),
    confirmPassword: z
      .string()
      .min(8, { message: 'Confirm password must be at least 8 characters' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type PasswordSchema = z.infer<typeof validationSchema>

const SettingsSecurity = () => {
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)

  const {
    getValues,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<PasswordSchema>({
    resolver: zodResolver(validationSchema),
  })

  // eslint-disable-next-line @typescript-eslint/require-await
  const onSubmit = async () => {
    setConfirmationOpen(true)
  }

  const handlePostSubmit = async () => {
    const values = getValues()
    setIsSubmitting(true)

    const data = await authClient.changePassword({
      newPassword: values.newPassword,
      currentPassword: values.password,
      revokeOtherSessions: false,
    })

    setConfirmationOpen(false)
    setIsSubmitting(false)

    if (data.error) {
      toast.push(
        <Notification type="danger" title="Error updating password">
          {data.error.message ??
            'An error occurred while updating your password. Please try again.'}
        </Notification>,
      )
    } else {
      toast.push(
        <Notification type="success" title="Password updated">
          Password has been successfully updated
        </Notification>,
      )
      reset()
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h4>Password</h4>
        <p>
          Remember, your password is your digital key to your account. Keep it
          safe, keep it secure!
        </p>
      </div>
      <Form ref={formRef} className="mb-8" onSubmit={handleSubmit(onSubmit)}>
        <FormItem
          label="Current password"
          invalid={Boolean(errors.password)}
          errorMessage={errors.password?.message}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input
                type="password"
                autoComplete="off"
                placeholder="•••••••••"
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="New password"
          invalid={Boolean(errors.newPassword)}
          errorMessage={errors.newPassword?.message}
        >
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Input
                type="password"
                autoComplete="off"
                placeholder="•••••••••"
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Confirm new password"
          invalid={Boolean(errors.confirmPassword)}
          errorMessage={errors.confirmPassword?.message}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input
                type="password"
                autoComplete="off"
                placeholder="•••••••••"
                {...field}
              />
            )}
          />
        </FormItem>
        <div className="flex justify-end">
          <Button variant="solid" type="submit">
            Update
          </Button>
        </div>
      </Form>
      <ConfirmDialog
        isOpen={confirmationOpen}
        type="warning"
        title="Update password"
        confirmButtonProps={{
          loading: isSubmitting,
          onClick: handlePostSubmit,
        }}
        onClose={() => setConfirmationOpen(false)}
        onRequestClose={() => setConfirmationOpen(false)}
        onCancel={() => setConfirmationOpen(false)}
      >
        <p>Are you sure you want to change your password?</p>
      </ConfirmDialog>
    </div>
  )
}

export default SettingsSecurity
