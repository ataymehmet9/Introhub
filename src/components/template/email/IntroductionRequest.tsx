import {
  Html,
  Button,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Link,
} from '@react-email/components'
import {
  emailStyles,
  createHeader,
  createMessageBox,
  createMessageTitle,
  createMessageText,
  headerColors,
} from './shared/styles'

type IntroductionRequestEmailProps = {
  approverName: string
  requesterName: string
  requesterEmail: string
  requesterCompany?: string | null
  requesterPosition?: string | null
  contactName: string
  contactEmail: string
  message: string
  dashboardUrl: string
}

export const IntroductionRequestEmail = ({
  approverName,
  requesterName,
  requesterEmail,
  requesterCompany,
  requesterPosition,
  contactName,
  contactEmail,
  message,
  dashboardUrl,
}: IntroductionRequestEmailProps) => (
  <Html lang="en">
    <Head />
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        {/* Header */}
        <Section style={createHeader(headerColors.primary)}>
          <Heading style={emailStyles.h1}>IntroHub</Heading>
        </Section>

        {/* Main Content */}
        <Section style={emailStyles.content}>
          <Heading style={emailStyles.h2}>New Introduction Request</Heading>

          <Text style={emailStyles.text}>Hi {approverName},</Text>

          <Text style={emailStyles.text}>
            You have received a new introduction request!
          </Text>

          {/* Requester Info Card */}
          <Section style={emailStyles.card}>
            <Text style={emailStyles.cardTitle}>FROM:</Text>
            <Text style={emailStyles.cardName}>{requesterName}</Text>
            {requesterPosition && requesterCompany && (
              <Text style={emailStyles.cardDetail}>
                {requesterPosition} at {requesterCompany}
              </Text>
            )}
            {requesterPosition && !requesterCompany && (
              <Text style={emailStyles.cardDetail}>{requesterPosition}</Text>
            )}
            {!requesterPosition && requesterCompany && (
              <Text style={emailStyles.cardDetail}>{requesterCompany}</Text>
            )}
            <Text style={emailStyles.cardEmail}>{requesterEmail}</Text>
          </Section>

          {/* Contact Info */}
          <Text style={emailStyles.text}>
            <strong>They would like to meet:</strong>
            <br />
            {contactName} ({contactEmail})
          </Text>

          {/* Message */}
          <Section style={createMessageBox('blue')}>
            <Text style={createMessageTitle('blue')}>Message:</Text>
            <Text style={createMessageText('blue')}>{message}</Text>
          </Section>

          {/* CTA Button */}
          <Section style={emailStyles.buttonContainer}>
            <Button style={emailStyles.button} href={dashboardUrl}>
              View Request
            </Button>
          </Section>

          <Text style={emailStyles.text}>
            Or visit your dashboard:{' '}
            <Link href={dashboardUrl} style={emailStyles.link}>
              {dashboardUrl}
            </Link>
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
