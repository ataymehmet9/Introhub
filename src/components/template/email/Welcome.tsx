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

type WelcomeEmailProps = {
  userName: string
  userEmail: string
  dashboardUrl: string
}

export const WelcomeEmail = ({
  userName,
  userEmail,
  dashboardUrl,
}: WelcomeEmailProps) => (
  <Html lang="en">
    <Head />
    <Body style={emailStyles.main}>
      <Container style={emailStyles.topContainer}>
        <EmailHeader />

        <EmailBody>
          {/* Hero Section */}
          <Section style={emailStyles.heroSection}>
            <Heading style={emailStyles.h1}>Welcome to IntroHub! 🎉</Heading>
          </Section>

          {/* Content Box */}
          <Section style={emailStyles.contentBox}>
            <Section style={emailStyles.contentBoxTopStripe} />
            <Section style={emailStyles.contentBoxInner}>
              <Text style={emailStyles.contentName}>{userName}</Text>

              <Text style={emailStyles.text}>Hi {userName},</Text>

              <Text style={emailStyles.text}>
                Thank you for joining IntroHub! We're excited to help you build
                meaningful professional connections and expand your network.
              </Text>

              {/* Account Info */}
              <Section style={emailStyles.card}>
                <Text style={emailStyles.cardTitle}>YOUR ACCOUNT</Text>
                <Text style={emailStyles.cardName}>{userName}</Text>
                <Text style={emailStyles.cardEmail}>
                  <strong>Email:</strong> {userEmail}
                </Text>
              </Section>

              {/* Getting Started */}
              <Section style={createMessageBox('primary')}>
                <Text style={createMessageTitle('primary')}>
                  Getting Started
                </Text>
                <Text
                  style={{
                    ...createMessageText('primary'),
                    marginBottom: '12px',
                  }}
                >
                  Here's how to make the most of IntroHub:
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
                      <strong>Add Your Contacts</strong> - Import your
                      professional network
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
                      <strong>Search for Connections</strong> - Find people
                      you'd like to meet
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
                      <strong>Request Introductions</strong> - Ask your contacts
                      to make introductions
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
                      <strong>Facilitate Introductions</strong> - Help others
                      connect with your network
                    </td>
                  </tr>
                </table>
              </Section>

              {/* Pro Tips */}
              <Section style={createMessageBox('green')}>
                <Text style={createMessageTitle('green')}>Pro Tips</Text>
                <table style={{ width: '100%', margin: 0, padding: 0 }}>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('green'),
                        paddingBottom: '8px',
                        verticalAlign: 'top',
                        width: '20px',
                      }}
                    >
                      •
                    </td>
                    <td
                      style={{
                        ...createMessageText('green'),
                        paddingBottom: '8px',
                      }}
                    >
                      Keep your profile updated with your current position and
                      company
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('green'),
                        paddingBottom: '8px',
                        verticalAlign: 'top',
                        width: '20px',
                      }}
                    >
                      •
                    </td>
                    <td
                      style={{
                        ...createMessageText('green'),
                        paddingBottom: '8px',
                      }}
                    >
                      Be thoughtful when requesting introductions
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('green'),
                        paddingBottom: '8px',
                        verticalAlign: 'top',
                        width: '20px',
                      }}
                    >
                      •
                    </td>
                    <td
                      style={{
                        ...createMessageText('green'),
                        paddingBottom: '8px',
                      }}
                    >
                      Respond promptly to introduction requests
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('green'),
                        paddingBottom: '8px',
                        verticalAlign: 'top',
                        width: '20px',
                      }}
                    >
                      •
                    </td>
                    <td
                      style={{
                        ...createMessageText('green'),
                        paddingBottom: '8px',
                      }}
                    >
                      Always follow up after being introduced to someone
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('green'),
                        paddingBottom: '0',
                        verticalAlign: 'top',
                        width: '20px',
                      }}
                    >
                      •
                    </td>
                    <td
                      style={{
                        ...createMessageText('green'),
                        paddingBottom: '0',
                      }}
                    >
                      Pay it forward by making introductions for others
                    </td>
                  </tr>
                </table>
              </Section>

              <Text style={emailStyles.text}>
                If you have any questions or need assistance, don't hesitate to
                reach out to our support team. We're here to help!
              </Text>

              <Text style={emailStyles.text}>
                Need help getting started? Visit our{' '}
                <Link href="https://introhub.com/help" style={emailStyles.link}>
                  Help Center
                </Link>{' '}
                or check out our{' '}
                <Link
                  href="https://introhub.com/what-is-introhub"
                  style={emailStyles.link}
                >
                  Getting Started Guide
                </Link>
                .
              </Text>

              <Text style={emailStyles.text}>
                Welcome aboard!
                <br />
                The IntroHub Team
              </Text>
            </Section>
          </Section>

          {/* CTA Button */}
          <Section style={emailStyles.buttonContainer}>
            <Button style={emailStyles.button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
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
