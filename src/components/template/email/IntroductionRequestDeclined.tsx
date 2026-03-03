import {
  Body,
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
      <Container style={emailStyles.container}>
        {/* Header */}
        <Section style={createHeader(headerColors.neutral)}>
          <Heading style={emailStyles.h1}>IntroHub</Heading>
        </Section>

        {/* Main Content */}
        <Section style={emailStyles.content}>
          <Heading style={emailStyles.h2}>Introduction Request Update</Heading>

          <Text style={emailStyles.text}>Hi {requesterName},</Text>

          <Text style={emailStyles.text}>
            Thank you for your interest in connecting with {contactName}.
            Unfortunately, {approverName} is unable to facilitate this
            introduction at this time.
          </Text>

          {/* Response Message */}
          {responseMessage && (
            <Section style={createMessageBox('yellow')}>
              <Text style={createMessageTitle('yellow')}>
                Message from {approverName}:
              </Text>
              <Text style={createMessageText('yellow')}>{responseMessage}</Text>
            </Section>
          )}

          {/* Encouragement */}
          <Section style={createMessageBox('blue')}>
            <Text style={createMessageTitle('blue')}>Keep Networking!</Text>
            <Text style={createMessageText('blue')}>
              While this particular introduction didn't work out, we encourage
              you to continue building your network. Here are some suggestions:
            </Text>
            <Text style={createMessageText('blue')}>
              • Try connecting with other professionals in your field
              <br />
              • Attend industry events and conferences
              <br />
              • Engage with content on professional networks
              <br />• Consider alternative paths to reach your goals
            </Text>
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
