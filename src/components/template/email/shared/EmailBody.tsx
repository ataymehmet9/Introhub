import { Section } from '@react-email/components'
import { emailStyles } from './styles'
import type { ReactNode } from 'react'

type EmailBodyProps = {
  children: ReactNode
}

export const EmailBody = ({ children }: EmailBodyProps) => (
  <Section style={emailStyles.container}>{children}</Section>
)

// Made with Bob
