import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Section,
  Text,
} from '@react-email/components'
import {
  createMessageBox,
  createMessageText,
  createMessageTitle,
  emailStyles,
} from './shared/styles'
import { EmailHeader } from './shared/EmailHeader'
import { EmailBody } from './shared/EmailBody'
import { EmailFooter } from './shared/EmailFooter'

type CRMSyncFailureEmailProps = {
  userName: string
  provider: string
  errorMessage: string
  syncStartedAt: string
  crmIntegrationsUrl: string
}

export const CRMSyncFailureEmail = ({
  userName,
  provider,
  errorMessage,
  syncStartedAt,
  crmIntegrationsUrl,
}: CRMSyncFailureEmailProps) => {
  const providerName = provider === 'hubspot' ? 'HubSpot' : provider

  return (
    <Html lang="en">
      <Head />
      <Body style={emailStyles.main}>
        <Container style={emailStyles.topContainer}>
          <EmailHeader />

          <EmailBody>
            {/* Hero Section */}
            <Section style={emailStyles.heroSection}>
              <Heading style={emailStyles.h1}>CRM Sync Failed ⚠️</Heading>
            </Section>

            {/* Content Box */}
            <Section style={emailStyles.contentBox}>
              <Section style={emailStyles.contentBoxTopStripe} />
              <Section style={emailStyles.contentBoxInner}>
                <Text style={emailStyles.contentName}>{userName}</Text>

                <Text style={emailStyles.text}>Hi {userName},</Text>

                <Text style={emailStyles.text}>
                  We encountered an issue while syncing contacts from your{' '}
                  {providerName} CRM integration.
                </Text>

                {/* Error Details */}
                <Section style={createMessageBox('yellow')}>
                  <Text style={createMessageTitle('yellow')}>
                    Error Details
                  </Text>
                  <Text style={createMessageText('yellow')}>
                    <strong>Provider:</strong> {providerName}
                  </Text>
                  <Text style={createMessageText('yellow')}>
                    <strong>Sync Started:</strong> {syncStartedAt}
                  </Text>
                  <Text
                    style={{
                      ...createMessageText('yellow'),
                      marginBottom: '0',
                    }}
                  >
                    <strong>Error:</strong> {errorMessage}
                  </Text>
                </Section>

                {/* What to Do */}
                <Section style={createMessageBox('primary')}>
                  <Text style={createMessageTitle('primary')}>
                    What You Can Do
                  </Text>
                  <table style={{ width: '100%', margin: 0, padding: 0 }}>
                    <tr>
                      <td
                        style={{
                          ...createMessageText('primary'),
                          paddingBottom: '8px',
                          verticalAlign: 'top',
                          width: '30px',
                        }}
                      >
                        1.
                      </td>
                      <td
                        style={{
                          ...createMessageText('primary'),
                          paddingBottom: '8px',
                        }}
                      >
                        <strong>Check Your Connection</strong> - Verify that
                        your {providerName} integration is still active
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          ...createMessageText('primary'),
                          paddingBottom: '8px',
                          verticalAlign: 'top',
                          width: '30px',
                        }}
                      >
                        2.
                      </td>
                      <td
                        style={{
                          ...createMessageText('primary'),
                          paddingBottom: '8px',
                        }}
                      >
                        <strong>Reconnect if Needed</strong> - If your OAuth
                        token has expired, you may need to reconnect
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          ...createMessageText('primary'),
                          paddingBottom: '8px',
                          verticalAlign: 'top',
                          width: '30px',
                        }}
                      >
                        3.
                      </td>
                      <td
                        style={{
                          ...createMessageText('primary'),
                          paddingBottom: '8px',
                        }}
                      >
                        <strong>Try Again</strong> - You can manually trigger a
                        sync from the CRM Integrations page
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          ...createMessageText('primary'),
                          paddingBottom: '0',
                          verticalAlign: 'top',
                          width: '30px',
                        }}
                      >
                        4.
                      </td>
                      <td
                        style={{
                          ...createMessageText('primary'),
                          paddingBottom: '0',
                        }}
                      >
                        <strong>Contact Support</strong> - If the issue
                        persists, our team is here to help
                      </td>
                    </tr>
                  </table>
                </Section>

                <Text style={emailStyles.text}>
                  Don't worry - your existing contacts are safe. This error only
                  affects the sync process, and you can try again at any time.
                </Text>

                <Text style={emailStyles.text}>
                  Need help? Visit our{' '}
                  <Link
                    href="https://introhub.com/help"
                    style={emailStyles.link}
                  >
                    Help Center
                  </Link>{' '}
                  or contact our support team.
                </Text>

                <Text style={emailStyles.text}>
                  Best regards,
                  <br />
                  The IntroHub Team
                </Text>
              </Section>
            </Section>

            {/* CTA Button */}
            <Section style={emailStyles.buttonContainer}>
              <Button style={emailStyles.button} href={crmIntegrationsUrl}>
                Go to CRM Integrations
              </Button>
            </Section>

            {/* Spacer */}
            <Section style={emailStyles.sectionSpacer} />

            <EmailFooter text="This is an automated notification from IntroHub. You're receiving this because you have CRM integrations enabled." />
          </EmailBody>
        </Container>
      </Body>
    </Html>
  )
}

// Made with Bob
