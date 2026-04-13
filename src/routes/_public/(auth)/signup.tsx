import { createFileRoute, useNavigate } from '@tanstack/react-router'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useThemeStore } from '@/store/themeStore'
import Logo from '@/components/template/Logo'
import { Alert } from '@/components/ui'
import ActionLink from '@/components/shared/ActionLink'
import SignUpForm from '@/components/auth/SignUpForm'
import OauthSignIn from '@/components/auth/OauthSignin'
import appConfig from '@/configs/app.config'

export const Route = createFileRoute('/_public/(auth)/signup')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const [message, setMessage] = useTimeOutMessage()

  const mode = useThemeStore((state) => state.mode)

  const onSignupSuccess = () => {
    navigate({ to: appConfig.authenticatedEntryPath })
  }

  return (
    <>
      <div className="mb-8">
        <Logo
          link="/"
          type="streamline"
          mode={mode}
          imgClass="mx-auto"
          logoWidth={60}
        />
      </div>
      <div className="mb-8">
        <h3 className="mb-1">Sign Up</h3>
        <p className="font-semibold heading-text">
          And lets get started with your free trial
        </p>
      </div>
      {message && (
        <Alert showIcon className="mb-4" type="danger">
          <span className="break-all">{message}</span>
        </Alert>
      )}
      <div className="mb-8">
        <OauthSignIn setMessage={setMessage} />
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <div className="border-t border-gray-200 dark:border-gray-800 flex-1 mt-[1px]" />
          <p className="font-semibold heading-text">
            or create account manually
          </p>
          <div className="border-t border-gray-200 dark:border-gray-800 flex-1 mt-[1px]" />
        </div>
      </div>
      <SignUpForm setMessage={setMessage} onSignupSuccess={onSignupSuccess} />
      <div className="mt-6 text-center">
        <span>Already have an account? </span>
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
