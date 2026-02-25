import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
} from '@react-email/components'
import {
  emailStyles,
  createHeader,
  createMessageBox,
  createMessageText,
  headerColors,
} from './shared/styles'

type IntroductionEmailProps = {
  approverName: string
  requesterName: string
  requesterEmail: string
  requesterCompany?: string | null
  requesterPosition?: string | null
  contactName: string
  contactEmail: string
  contactCompany?: string | null
  contactPosition?: string | null
  customMessage: string
}

export const IntroductionEmail = ({
  approverName,
  requesterName,
  requesterEmail,
  requesterCompany,
  requesterPosition,
  contactName,
  contactEmail,
  contactCompany,
  contactPosition,
  customMessage,
}: IntroductionEmailProps) => (
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
          <Heading style={emailStyles.h2}>
            Introduction: {requesterName} {'<>'} {contactName}
          </Heading>

          <Text style={emailStyles.text}>
            Hi {contactName} and {requesterName},
          </Text>

          <Text style={emailStyles.text}>I'd like to introduce you both!</Text>

          {/* Contact Card */}
          <Section style={emailStyles.card}>
            <Text style={emailStyles.cardName}>{contactName}</Text>
            {contactPosition && contactCompany && (
              <Text style={emailStyles.cardDetail}>
                {contactPosition} at {contactCompany}
              </Text>
            )}
            {contactPosition && !contactCompany && (
              <Text style={emailStyles.cardDetail}>{contactPosition}</Text>
            )}
            {!contactPosition && contactCompany && (
              <Text style={emailStyles.cardDetail}>{contactCompany}</Text>
            )}
            <Text style={emailStyles.cardEmail}>
              <strong>Email:</strong> {contactEmail}
            </Text>
          </Section>

          {/* Requester Card */}
          <Section style={emailStyles.card}>
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
            <Text style={emailStyles.cardEmail}>
              <strong>Email:</strong> {requesterEmail}
            </Text>
          </Section>

          {/* Custom Message */}
          {customMessage && (
            <Section style={createMessageBox('green')}>
              <Text style={createMessageText('green')}>{customMessage}</Text>
            </Section>
          )}

          <Text style={emailStyles.text}>
            I think you both would benefit from connecting. Please feel free to
            take it from here!
          </Text>

          <Text style={emailStyles.text}>
            Best regards,
            <br />
            {approverName}
          </Text>
        </Section>

        {/* Footer */}
        <Hr style={emailStyles.hr} />
        <Section style={emailStyles.footer}>
          <Text style={emailStyles.footerText}>
            This introduction was facilitated by IntroHub. If you have any
            questions, please contact support.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)
