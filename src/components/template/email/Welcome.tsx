import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from '@react-email/components'
import {
  createHeader,
  createMessageBox,
  createMessageText,
  createMessageTitle,
  emailStyles,
  headerColors,
} from './shared/styles'

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
      <Container style={emailStyles.container}>
        {/* Header */}
        <Section style={createHeader(headerColors.success)}>
          <Heading style={emailStyles.h1}>IntroHub</Heading>
        </Section>

        {/* Main Content */}
        <Section style={emailStyles.content}>
          <Heading style={emailStyles.h2}>Welcome to IntroHub! 🎉</Heading>

          <Text style={emailStyles.text}>Hi {userName},</Text>

          <Text style={emailStyles.text}>
            Thank you for joining IntroHub! We're excited to help you build
            meaningful professional connections and expand your network.
          </Text>

          {/* Account Info Card */}
          <Section style={emailStyles.card}>
            <Text style={emailStyles.cardTitle}>YOUR ACCOUNT</Text>
            <Text style={emailStyles.cardName}>{userName}</Text>
            <Text style={emailStyles.cardEmail}>
              <strong>Email:</strong> {userEmail}
            </Text>
          </Section>

          {/* Getting Started */}
          <Section style={createMessageBox('primary')}>
            <Text style={createMessageTitle('primary')}>Getting Started</Text>
            <Text style={createMessageText('primary')}>
              Here's how to make the most of IntroHub:
            </Text>
            <Text style={createMessageText('primary')}>
              1. <strong>Add Your Contacts</strong> - Import your professional
              network
              <br />
              2. <strong>Search for Connections</strong> - Find people you'd
              like to meet
              <br />
              3. <strong>Request Introductions</strong> - Ask your contacts to
              make introductions
              <br />
              4. <strong>Facilitate Introductions</strong> - Help others connect
              with your network
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={emailStyles.buttonContainer}>
            <Button style={emailStyles.button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>

          {/* Tips Section */}
          <Section style={createMessageBox('green')}>
            <Text style={createMessageTitle('green')}>Pro Tips</Text>
            <Text style={createMessageText('green')}>
              • Keep your profile updated with your current position and company
              <br />
              • Be thoughtful when requesting introductions
              <br />
              • Respond promptly to introduction requests
              <br />
              • Always follow up after being introduced to someone
              <br />• Pay it forward by making introductions for others
            </Text>
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

        {/* Footer */}
        <Hr style={emailStyles.hr} />
        <Section style={emailStyles.footer}>
          <Text style={emailStyles.footerText}>
            This email was sent by IntroHub. If you have any questions, please
            contact support.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)
