// Shared email styles for IntroHub
// These styles are used across all email templates for consistency

export const emailStyles = {
  // Main container styles
  main: {
    backgroundColor: '#f6f9fc',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  },

  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
  },

  // Header styles
  header: {
    padding: '32px 48px',
  },

  h1: {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0',
    padding: '0',
  },

  // Content area
  content: {
    padding: '0 48px',
  },

  h2: {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '32px 0 24px',
  },

  text: {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '16px 0',
  },

  // Card styles
  card: {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
  },

  cardTitle: {
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 8px',
  },

  cardName: {
    color: '#1f2937',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 4px',
  },

  cardDetail: {
    color: '#4b5563',
    fontSize: '14px',
    margin: '4px 0',
  },

  cardEmail: {
    color: '#2563eb',
    fontSize: '14px',
    margin: '8px 0 0',
  },

  // Message box styles
  messageBox: {
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },

  messageTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0 0 12px',
  },

  messageText: {
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0',
    whiteSpace: 'pre-wrap' as const,
  },

  // Button styles
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },

  button: {
    backgroundColor: '#2563eb',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
  },

  // Link styles
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },

  // Divider
  hr: {
    borderColor: '#e5e7eb',
    margin: '32px 0',
  },

  // Footer
  footer: {
    padding: '0 48px',
  },

  footerText: {
    color: '#6b7280',
    fontSize: '12px',
    lineHeight: '16px',
    margin: '0',
  },
}

// Color variants for different email types
export const headerColors = {
  primary: '#2563eb', // Blue - for requests and general
  success: '#10b981', // Green - for approvals and introductions
  neutral: '#6b7280', // Gray - for declined/neutral
  warning: '#f59e0b', // Orange - for warnings
  info: '#0ea5e9', // Light blue - for informational
}

// Message box color variants
export const messageBoxColors = {
  blue: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    titleColor: '#1e40af',
    textColor: '#1e3a8a',
  },
  green: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    titleColor: '#065f46',
    textColor: '#064e3b',
  },
  yellow: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    titleColor: '#92400e',
    textColor: '#78350f',
  },
  gray: {
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    titleColor: '#374151',
    textColor: '#1f2937',
  },
}

// Helper function to create a colored header
export const createHeader = (color: string) => ({
  ...emailStyles.header,
  backgroundColor: color,
})

// Helper function to create a colored message box
export const createMessageBox = (
  variant: keyof typeof messageBoxColors = 'blue',
) => ({
  ...emailStyles.messageBox,
  backgroundColor: messageBoxColors[variant].backgroundColor,
  border: messageBoxColors[variant].border,
})

// Helper function to create message title with color
export const createMessageTitle = (
  variant: keyof typeof messageBoxColors = 'blue',
) => ({
  ...emailStyles.messageTitle,
  color: messageBoxColors[variant].titleColor,
})

// Helper function to create message text with color
export const createMessageText = (
  variant: keyof typeof messageBoxColors = 'blue',
) => ({
  ...emailStyles.messageText,
  color: messageBoxColors[variant].textColor,
})
