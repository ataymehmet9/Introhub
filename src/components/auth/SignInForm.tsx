import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePostHog } from '@posthog/react'
import type { ReactNode } from 'react'
import type { CommonProps } from '@/@types/common'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Form, FormItem } from '@/components/ui/Form'
import { signIn } from '@/lib/auth-client'

const signInSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInFormData = z.infer<typeof signInSchema>

interface SignInFormProps extends CommonProps {
  disableSubmit?: boolean
  setMessage?: (message: string) => void
  onSignInSuccess: () => void
  passwordHint?: string | ReactNode
}

const SignInForm = (props: SignInFormProps) => {
  const {
    disableSubmit = false,
    className,
    setMessage,
    onSignInSuccess,
    passwordHint,
  } = props

  const [isSubmitting, setSubmitting] = useState<boolean>(false)
  const posthog = usePostHog()

  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const onSignIn = async (values: SignInFormData) => {
    const { password, email } = values

    if (!disableSubmit) {
      setSubmitting(true)
      const { error } = await signIn.email({ email, password })

      setSubmitting(false)

      if (error) {
        // Provide more helpful error message for OAuth users
        const errorMessage = error.message?.includes(
          'Invalid email or password',
        )
          ? 'Invalid email or password. If you signed up with Google, LinkedIn, or Microsoft, please use the social login buttons below.'
          : (error.message ?? 'An error occurred')

        setMessage?.(errorMessage)
        // Track failed login
        posthog?.capture('login_failed', {
          email,
          error: error.message,
          timestamp: new Date().toISOString(),
        })
      } else {
        // Track successful login
        posthog?.capture('login_success', {
          email,
          timestamp: new Date().toISOString(),
        })
        onSignInSuccess()
      }
    }
  }

  return (
    <div className={className}>
      <Form onSubmit={handleSubmit(onSignIn)}>
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
                placeholder="you@example.com"
                autoComplete="off"
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Password"
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
                placeholder="*********"
                {...field}
              />
            )}
          />
        </FormItem>
        {passwordHint}
        <Button block loading={isSubmitting} variant="solid" type="submit">
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </Button>
      </Form>
    </div>
  )
}

export default SignInForm
