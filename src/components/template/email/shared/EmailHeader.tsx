import { Section, Text } from '@react-email/components'
import { emailStyles } from './styles'

export const EmailHeader = () => (
  <>
    {/* Top Brand Stripe */}
    <Section style={emailStyles.topStripe} />

    {/* Logo Section */}
    <Section style={emailStyles.logoSection}>
      <Text
        style={{
          ...emailStyles.logo,
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#fb732c',
          margin: 0,
        }}
      >
        IntroHub
      </Text>
    </Section>

    {/* Spacer */}
    <Section style={emailStyles.spacer} />
  </>
)
