import { ReactNode, useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import { signIn } from '@/lib/auth-client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CommonProps } from '@/@types/common'
import { z } from 'zod'
import { usePostHog } from '@posthog/react'

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
        setMessage?.(error.message ?? 'An error occurred')
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
