import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CommonProps } from '@/@types/common'
import type { UserEmail } from '@/schemas'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Form, FormItem } from '@/components/ui/Form'
import { requestPasswordReset } from '@/services/auth.functions'
import { userEmailSchema } from '@/schemas'

interface ForgotPasswordFormProps extends CommonProps {
  emailSent: boolean
  setEmailSent?: (compplete: boolean) => void
  setMessage?: (message: string) => void
}

const ForgotPasswordForm = (props: ForgotPasswordFormProps) => {
  const { className, setMessage, setEmailSent, emailSent, children } = props

  const [isSubmitting, setSubmitting] = useState<boolean>(false)

  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<UserEmail>({
    resolver: zodResolver(userEmailSchema),
  })

  const onForgotPassword = async (values: UserEmail) => {
    const { email } = values

    try {
      const { error } = await requestPasswordReset({ data: { email } })

      if (!error) {
        setSubmitting(false)
        setEmailSent?.(true)
      }
    } catch (errors) {
      setMessage?.(typeof errors === 'string' ? errors : 'Some error occured!')
      setSubmitting(false)
    }

    setSubmitting(false)
  }

  return (
    <div className={className}>
      {!emailSent ? (
        <Form onSubmit={handleSubmit(onForgotPassword)}>
          <FormItem
            label="Email"
            invalid={Boolean(errors.email)}
            errorMessage={errors.email?.message}
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  type="email"
                  placeholder="Email"
                  autoComplete="off"
                  {...field}
                />
              )}
            />
          </FormItem>
          <Button block loading={isSubmitting} variant="solid" type="submit">
            {isSubmitting ? 'Submiting...' : 'Submit'}
          </Button>
        </Form>
      ) : (
        <>{children}</>
      )}
    </div>
  )
}

export default ForgotPasswordForm
