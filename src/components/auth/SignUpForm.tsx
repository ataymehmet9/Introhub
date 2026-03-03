import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePostHog } from '@posthog/react'
import type { CommonProps } from '@/@types/common'
import type { UserSignup } from '@/schemas';
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Form, FormItem } from '@/components/ui/Form'
import { signUp } from '@/lib/auth-client'
import { userSignupSchema } from '@/schemas'

interface SignUpFormProps extends CommonProps {
  disableSubmit?: boolean
  setMessage?: (message: string) => void
  onSignupSuccess: () => void
}

const SignUpForm = (props: SignUpFormProps) => {
  const {
    disableSubmit = false,
    className,
    setMessage,
    onSignupSuccess,
  } = props

  const [isSubmitting, setSubmitting] = useState<boolean>(false)
  const posthog = usePostHog()

  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<UserSignup>({
    resolver: zodResolver(userSignupSchema),
  })

  const onSignUp = async (values: UserSignup) => {
    const { password, email, name, position, company } = values

    if (!disableSubmit) {
      setSubmitting(true)
      const { error } = await signUp.email({
        email,
        password,
        name,
        company,
        position,
      })

      setSubmitting(false)

      if (error) {
        setMessage?.(error.message ?? 'An error occurred')
        // Track failed signup
        posthog?.capture('signup_failed', {
          email,
          error: error.message,
          timestamp: new Date().toISOString(),
        })
      } else {
        // Track successful signup
        posthog?.capture('signup_success', {
          email,
          name,
          company: company || null,
          position: position || null,
          timestamp: new Date().toISOString(),
        })
        onSignupSuccess()
      }
    }
  }

  return (
    <div className={className}>
      <Form onSubmit={handleSubmit(onSignUp)}>
        <FormItem
          label="Full name"
          invalid={Boolean(errors.name)}
          errorMessage={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                placeholder="John Doe"
                autoComplete="off"
                {...field}
              />
            )}
          />
        </FormItem>
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
        <FormItem
          label="Confirm Password"
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
                placeholder="*********"
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Company (Optional)"
          invalid={Boolean(errors.company)}
          errorMessage={errors.company?.message}
        >
          <Controller
            name="company"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                placeholder="Acme Inc."
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Position (Optional)"
          invalid={Boolean(errors.position)}
          errorMessage={errors.position?.message}
        >
          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                placeholder="Software Engineer"
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
        </FormItem>
        <Button block loading={isSubmitting} variant="solid" type="submit">
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </Form>
    </div>
  )
}

export default SignUpForm
