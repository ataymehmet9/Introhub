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
  createMessageTitle,
  createMessageText,
  headerColors,
} from './shared/styles'

type IntroductionRequestApprovedEmailProps = {
  requesterName: string
  approverName: string
  contactName: string
  contactEmail: string
  contactCompany?: string | null
  contactPosition?: string | null
  responseMessage?: string | null
}

export const IntroductionRequestApprovedEmail = ({
  requesterName,
  approverName,
  contactName,
  contactEmail,
  contactCompany,
  contactPosition,
  responseMessage,
}: IntroductionRequestApprovedEmailProps) => (
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
            🎉 Introduction Request Approved!
          </Heading>

          <Text style={emailStyles.text}>Hi {requesterName},</Text>

          <Text style={emailStyles.text}>
            Great news! {approverName} has approved your introduction request.
          </Text>

          {/* Contact Info Card */}
          <Section style={emailStyles.card}>
            <Text style={emailStyles.cardTitle}>CONTACT INFORMATION:</Text>
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

          {/* Response Message */}
          {responseMessage && (
            <Section style={createMessageBox('green')}>
              <Text style={createMessageTitle('green')}>
                Message from {approverName}:
              </Text>
              <Text style={createMessageText('green')}>{responseMessage}</Text>
            </Section>
          )}

          {/* Next Steps */}
          <Section style={createMessageBox('blue')}>
            <Text style={createMessageTitle('blue')}>Next Steps:</Text>
            <Text style={createMessageText('blue')}>
              1. Reach out to {contactName} via email
              <br />
              2. Mention that {approverName} connected you
              <br />
              3. Be professional and respectful of their time
              <br />
              4. Follow up if you don't hear back within a week
            </Text>
          </Section>

          <Text style={emailStyles.text}>
            Good luck with your connection! We hope this introduction leads to
            great opportunities.
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
