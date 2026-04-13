import {
  Body,
  Container,
  Head,
  Heading,
  Html,
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
      <Container style={emailStyles.topContainer}>
        <EmailHeader />

        <EmailBody>
          {/* Hero Section */}
          <Section style={emailStyles.heroSection}>
            <Heading style={emailStyles.h1}>
              🎉 Introduction Request Approved!
            </Heading>
          </Section>

          {/* Content Box */}
          <Section style={emailStyles.contentBox}>
            <Section style={emailStyles.contentBoxTopStripe} />
            <Section style={emailStyles.contentBoxInner}>
              <Text style={emailStyles.text}>Hi {requesterName},</Text>

              <Text style={emailStyles.text}>
                Great news! {approverName} has approved your introduction
                request.
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
                  <Text style={createMessageText('green')}>
                    {responseMessage}
                  </Text>
                </Section>
              )}

              {/* Next Steps */}
              <Section style={createMessageBox('primary')}>
                <Text style={createMessageTitle('primary')}>Next Steps:</Text>
                <table
                  style={{
                    width: '100%',
                    margin: 0,
                    padding: 0,
                    marginTop: '12px',
                  }}
                >
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
                      Reach out to {contactName} via email
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
                      Mention that {approverName} connected you
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
                      Be professional and respectful of their time
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
                      Follow up if you don't hear back within a week
                    </td>
                  </tr>
                </table>
              </Section>

              <Text style={emailStyles.text}>
                Good luck with your connection! We hope this introduction leads
                to great opportunities.
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
