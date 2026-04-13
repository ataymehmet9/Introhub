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
  emailStyles,
} from './shared/styles'
import { EmailHeader } from './shared/EmailHeader'
import { EmailBody } from './shared/EmailBody'
import { EmailFooter } from './shared/EmailFooter'
import { formatMessageWithLineBreaks } from './shared/formatMessage'

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
      <Container style={emailStyles.topContainer}>
        <EmailHeader />

        <EmailBody>
          {/* Hero Section */}
          <Section style={emailStyles.heroSection}>
            <Heading style={emailStyles.h1}>
              Introduction: {requesterName} {'<>'} {contactName}
            </Heading>
          </Section>

          {/* Content Box */}
          <Section style={emailStyles.contentBox}>
            <Section style={emailStyles.contentBoxTopStripe} />
            <Section style={emailStyles.contentBoxInner}>
              <Text style={emailStyles.text}>
                Hi {contactName} and {requesterName},
              </Text>

              <Text style={emailStyles.text}>
                I'd like to introduce you both!
              </Text>

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
                  <Text style={emailStyles.cardDetail}>
                    {requesterPosition}
                  </Text>
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
                  <Text style={createMessageText('green')}>
                    {formatMessageWithLineBreaks(customMessage)}
                  </Text>
                </Section>
              )}

              <Text style={emailStyles.text}>
                I think you both would benefit from connecting. Please feel free
                to take it from here!
              </Text>

              <Text style={emailStyles.text}>
                Best regards,
                <br />
                {approverName}
              </Text>
            </Section>
          </Section>

          {/* Spacer */}
          <Section style={emailStyles.sectionSpacer} />

          <EmailFooter text="This introduction was facilitated by IntroHub. If you have any questions, please contact support." />
        </EmailBody>
      </Container>
    </Body>
  </Html>
)

// Made with Bob
