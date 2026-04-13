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
import { emailStyles } from './shared/styles'
import { EmailHeader } from './shared/EmailHeader'
import { EmailBody } from './shared/EmailBody'
import { EmailFooter } from './shared/EmailFooter'

type ForgotPasswordEmailProps = {
  to: string
  url: string
}

export const ForgotPasswordEmail = ({ to, url }: ForgotPasswordEmailProps) => (
  <Html lang="en">
    <Head />
    <Body style={emailStyles.main}>
      <Container style={emailStyles.topContainer}>
        <EmailHeader />

        <EmailBody>
          {/* Hero Section */}
          <Section style={emailStyles.heroSection}>
            <Heading style={emailStyles.h1}>Reset your password</Heading>
          </Section>

          {/* Content Box */}
          <Section style={emailStyles.contentBox}>
            <Section style={emailStyles.contentBoxTopStripe} />
            <Section style={emailStyles.contentBoxInner}>
              <Text style={emailStyles.text}>Hi {to},</Text>

              <Text style={emailStyles.text}>
                We received a request to reset your password. Click the button
                below to create a new password.
              </Text>

              <Text style={emailStyles.text}>
                If you didn't request this password reset, you can safely ignore
                this email. Your password will remain unchanged.
              </Text>

              <Text style={emailStyles.text}>
                This link will expire in 24 hours for security reasons.
              </Text>
            </Section>
          </Section>

          {/* CTA Button */}
          <Section style={emailStyles.buttonContainer}>
            <Button style={emailStyles.button} href={url}>
              Reset Password
            </Button>
          </Section>

          {/* Alternative Link Section */}
          <Section
            style={{
              ...emailStyles.content,
              paddingTop: '20px',
              paddingBottom: '20px',
            }}
          >
            <Text
              style={{
                ...emailStyles.textSmall,
                textAlign: 'center' as const,
                color: '#6b7280',
              }}
            >
              If the button above doesn't work, copy and paste this link into
              your browser:
            </Text>
            <Text
              style={{
                ...emailStyles.textSmall,
                textAlign: 'center' as const,
                wordBreak: 'break-all' as const,
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                margin: '10px 0',
                fontFamily: 'monospace',
              }}
            >
              <Link
                href={url}
                style={{ color: '#fb732c', textDecoration: 'none' }}
              >
                {url}
              </Link>
            </Text>
          </Section>

          {/* Spacer */}
          <Section style={emailStyles.sectionSpacer} />

          <EmailFooter />
        </EmailBody>
      </Container>
    </Body>
  </Html>
)

// Made with Bob
