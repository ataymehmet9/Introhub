import {
  Body,
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

type IntroductionRequestDeclinedEmailProps = {
  requesterName: string
  approverName: string
  contactName: string
  responseMessage?: string | null
}

export const IntroductionRequestDeclinedEmail = ({
  requesterName,
  approverName,
  contactName,
  responseMessage,
}: IntroductionRequestDeclinedEmailProps) => (
  <Html lang="en">
    <Head />
    <Body style={emailStyles.main}>
      <Container style={emailStyles.topContainer}>
        <EmailHeader />

        <EmailBody>
          {/* Hero Section */}
          <Section style={emailStyles.heroSection}>
            <Heading style={emailStyles.h1}>
              Introduction Request Update
            </Heading>
          </Section>

          {/* Content Box */}
          <Section style={emailStyles.contentBox}>
            <Section style={emailStyles.contentBoxTopStripe} />
            <Section style={emailStyles.contentBoxInner}>
              <Text style={emailStyles.text}>Hi {requesterName},</Text>

              <Text style={emailStyles.text}>
                Thank you for your interest in connecting with {contactName}.
                Unfortunately, {approverName} is unable to facilitate this
                introduction at this time.
              </Text>

              {/* Response Message */}
              {responseMessage && (
                <Section style={createMessageBox('primary')}>
                  <Text style={createMessageTitle('primary')}>
                    Message from {approverName}:
                  </Text>
                  <Text style={createMessageText('primary')}>
                    {responseMessage}
                  </Text>
                </Section>
              )}

              {/* Encouragement */}
              <Section style={createMessageBox('primary')}>
                <Text style={createMessageTitle('primary')}>
                  Keep Networking!
                </Text>
                <Text
                  style={{
                    ...createMessageText('primary'),
                    marginBottom: '12px',
                  }}
                >
                  While this particular introduction didn't work out, we
                  encourage you to continue building your network. Here are some
                  suggestions:
                </Text>
                <table style={{ width: '100%', margin: 0, padding: 0 }}>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                        verticalAlign: 'top',
                        width: '20px',
                      }}
                    >
                      •
                    </td>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                      }}
                    >
                      Try connecting with other professionals in your field
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                        verticalAlign: 'top',
                        width: '20px',
                      }}
                    >
                      •
                    </td>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                      }}
                    >
                      Attend industry events and conferences
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                        verticalAlign: 'top',
                        width: '20px',
                      }}
                    >
                      •
                    </td>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                      }}
                    >
                      Engage with content on professional networks
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '0',
                        verticalAlign: 'top',
                        width: '20px',
                      }}
                    >
                      •
                    </td>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '0',
                      }}
                    >
                      Consider alternative paths to reach your goals
                    </td>
                  </tr>
                </table>
              </Section>

              <Text style={emailStyles.text}>
                Thank you for using IntroHub. We wish you the best in your
                networking journey!
              </Text>

              <Text style={emailStyles.text}>
                Need help? Visit our{' '}
                <Link href="https://introhub.com/help" style={emailStyles.link}>
                  Help Center
                </Link>{' '}
                or contact support.
              </Text>
            </Section>
          </Section>

          {/* Spacer */}
          <Section style={emailStyles.sectionSpacer} />

          <EmailFooter text="This email was sent by IntroHub. If you have any questions, please contact support." />
        </EmailBody>
      </Container>
    </Body>
  </Html>
)

// Made with Bob
