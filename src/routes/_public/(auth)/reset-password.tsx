import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import appConfig from '@/configs/app.config'
import { Alert, Button } from '@/components/ui'
import { ActionLink } from '@/components/shared'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

export const Route = createFileRoute('/_public/(auth)/reset-password')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || '',
      error: (search.error as string) || '',
    }
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  beforeLoad: async ({ search }) => {
    const { error, token } = search

    if (!token || error) {
      throw redirect({ to: appConfig.authPaths.login })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { token } = Route.useSearch()
  const [resetComplete, setResetComplete] = useState(false)

  const [message, setMessage] = useTimeOutMessage()

  const navigate = useNavigate()

  const handleContinue = () => {
    navigate({ to: appConfig.authPaths.login })
  }

  return (
    <>
      <div className="mb-6">
        {resetComplete ? (
          <>
            <h3 className="mb-1">Reset done</h3>
            <p className="font-semibold heading-text">
              Your password has been successfully reset
            </p>
          </>
        ) : (
          <>
            <h3 className="mb-1">Set new password</h3>
            <p className="font-semibold heading-text">
              Your new password must different to previous password
            </p>
          </>
        )}
      </div>
      {message && (
        <Alert showIcon className="mb-4" type="danger">
          <span className="break-all">{message}</span>
        </Alert>
      )}
      <ResetPasswordForm
        resetComplete={resetComplete}
        setMessage={setMessage}
        setResetComplete={setResetComplete}
        token={token}
      >
        <Button block variant="solid" type="button" onClick={handleContinue}>
          Continue
        </Button>
      </ResetPasswordForm>
      <div className="mt-4 text-center">
        <span>Back to </span>
        <ActionLink
          to={appConfig.authPaths.login}
          className="heading-text font-bold"
          themeColor={false}
        >
          Sign in
        </ActionLink>
      </div>
    </>
  )
}
