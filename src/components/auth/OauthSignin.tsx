import { usePostHog } from '@posthog/react'
import Button from '@/components/ui/Button'
import appConfig from '@/configs/app.config'
import { useSecureSignIn } from '@/lib/auth-wrapper'

type OauthSignInProps = {
  setMessage?: (message: string) => void
  disableSubmit?: boolean
}

const OauthSignIn = (_props: OauthSignInProps) => {
  const posthog = usePostHog()
  const { signInSocial } = useSecureSignIn()

  const handleSocialSignIn = async (
    provider: 'linkedin' | 'microsoft' | 'google',
  ) => {
    // Track OAuth sign-in attempt
    posthog.capture('oauth_signin_attempt', {
      provider,
      timestamp: new Date().toISOString(),
    })

    await signInSocial({
      provider,
      callbackURL: appConfig.authenticatedEntryPath,
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        className="flex-1"
        type="button"
        onClick={() => handleSocialSignIn('google')}
      >
        <div className="flex items-center justify-center gap-2">
          <img
            className="h-[25px] w-[25px]"
            src="/img/others/google.png"
            alt="Google sign in"
          />
        </div>
      </Button>
      <Button
        className="flex-1"
        type="button"
        onClick={() => handleSocialSignIn('microsoft')}
      >
        <div className="flex items-center justify-center gap-2">
          <img
            className="h-[25px] w-[25px]"
            src="/img/others/microsoft.png"
            alt="Microsoft sign in"
          />
        </div>
      </Button>
      <Button
        className="flex-1"
        type="button"
        onClick={() => handleSocialSignIn('linkedin')}
      >
        <div className="flex items-center justify-center gap-2">
          <img
            className="h-[25px] w-[25px]"
            src="/img/others/linkedin.png"
            alt="LinkedIn sign in"
          />
        </div>
      </Button>
    </div>
  )
}

export default OauthSignIn
