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

type DemoRequestEmailProps = {
  name: string
  email: string
  company: string
  message: string
  submittedAt: string
}

export const DemoRequestEmail = ({
  name,
  email,
  company,
  message,
  submittedAt,
}: DemoRequestEmailProps) => (
  <Html lang="en">
    <Head />
    <Body style={emailStyles.main}>
      <Container style={emailStyles.topContainer}>
        <EmailHeader />

        <EmailBody>
          {/* Hero Section */}
          <Section style={emailStyles.heroSection}>
            <Heading style={emailStyles.h1}>New Demo Request 📋</Heading>
          </Section>

          {/* Content Box */}
          <Section style={emailStyles.contentBox}>
            <Section style={emailStyles.contentBoxTopStripe} />
            <Section style={emailStyles.contentBoxInner}>
              <Text style={emailStyles.text}>
                A new demo request has been submitted through the IntroHub
                website.
              </Text>

              {/* Contact Information */}
              <Section style={createMessageBox('primary')}>
                <Text style={createMessageTitle('primary')}>
                  Contact Information
                </Text>
                <table style={{ width: '100%', margin: 0, padding: 0 }}>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                        fontWeight: 'bold',
                        width: '100px',
                      }}
                    >
                      Name:
                    </td>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                      }}
                    >
                      {name}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                        fontWeight: 'bold',
                        width: '100px',
                      }}
                    >
                      Email:
                    </td>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                      }}
                    >
                      {email}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                        fontWeight: 'bold',
                        width: '100px',
                      }}
                    >
                      Company:
                    </td>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '8px',
                      }}
                    >
                      {company}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '0',
                        fontWeight: 'bold',
                        width: '100px',
                        verticalAlign: 'top',
                      }}
                    >
                      Submitted:
                    </td>
                    <td
                      style={{
                        ...createMessageText('primary'),
                        paddingBottom: '0',
                      }}
                    >
                      {submittedAt}
                    </td>
                  </tr>
                </table>
              </Section>

              {/* Message */}
              {message && (
                <Section
                  style={{
                    ...createMessageBox('green'),
                    width: '100%',
                  }}
                >
                  <Text style={createMessageTitle('green')}>Their Message</Text>
                  <table
                    role="presentation"
                    width="100%"
                    style={{
                      width: '100%',
                      margin: 0,
                      padding: 0,
                      tableLayout: 'fixed',
                    }}
                  >
                    <tr>
                      <td
                        style={{
                          ...createMessageText('green'),
                          width: '100%',
                          display: 'block',
                          textAlign: 'left',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }}
                      >
                        {message}
                      </td>
                    </tr>
                  </table>
                </Section>
              )}

              <Text style={emailStyles.text}>
                Please follow up with this prospect within 24 hours to schedule
                their demo.
              </Text>

              <Text style={emailStyles.text}>
                Best regards,
                <br />
                IntroHub System
              </Text>
            </Section>
          </Section>

          {/* Spacer */}
          <Section style={emailStyles.sectionSpacer} />

          <EmailFooter text="This is an automated notification from IntroHub. Demo requests are sent to sales@intro-hub.com." />
        </EmailBody>
      </Container>
    </Body>
  </Html>
)

// Made with Bob
