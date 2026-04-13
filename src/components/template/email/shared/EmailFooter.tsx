import { Section, Text } from '@react-email/components'
import { emailStyles } from './styles'

type EmailFooterProps = {
  text?: string
}

export const EmailFooter = ({ text }: EmailFooterProps) => (
  <Section style={emailStyles.footerSection}>
    <Section style={emailStyles.footerTopStripe} />

    <Section style={{ textAlign: 'center' as const }}>
      <Text
        style={{
          ...emailStyles.footerLogo,
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#ffffff',
        }}
      >
        IntroHub
      </Text>
    </Section>

    {text && <Text style={emailStyles.footerText}>{text}</Text>}

    <Section style={emailStyles.footerDivider} />

    <Text style={emailStyles.footerCopyright}>
      IntroHub Copyright © {`${new Date().getFullYear()}`}
    </Text>
  </Section>
)

// Made with Bob
