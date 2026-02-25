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
} from '@react-email/components'
import { emailStyles, createHeader, headerColors } from './shared/styles'

type ForgotPasswordEmailProps = {
  to: string
  url: string
}

export const ForgotPasswordEmail = ({ to, url }: ForgotPasswordEmailProps) => (
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
          <Heading style={emailStyles.h2}>Reset your password</Heading>

          <Text style={emailStyles.text}>Hi {to},</Text>

          <Text style={emailStyles.text}>
            We received a request to reset your password. Click the button below
            to create a new password.
          </Text>

          {/* CTA Button */}
          <Section style={emailStyles.buttonContainer}>
            <Button style={emailStyles.button} href={url}>
              Reset Password
            </Button>
          </Section>

          <Text style={emailStyles.text}>
            If you didn't request this password reset, you can safely ignore
            this email. Your password will remain unchanged.
          </Text>

          <Text style={emailStyles.text}>
            This link will expire in 24 hours for security reasons.
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
