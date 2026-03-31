// Shared email styles for IntroHub
// These styles are used across all email templates for consistency
// Using brand colors: primary (#fb732c), primaryDeep (#cc5c24), primaryMild (#fc8f56)

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
    color: '#fb732c', // Brand primary color
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
    backgroundColor: '#fb732c', // Brand primary color
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
    color: '#fb732c', // Brand primary color
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

// Color variants for different email types - using brand colors
export const headerColors = {
  primary: '#fb732c', // Brand primary - for requests and general
  success: '#10b981', // Keep green for success/approvals
  neutral: '#6b7280', // Gray - for declined/neutral
  warning: '#fb732c', // Use brand primary for warnings too
  info: '#fb732c', // Use brand primary for informational
}

// Message box color variants - using brand colors
export const messageBoxColors = {
  primary: {
    backgroundColor: '#fb732c1a', // Brand primarySubtle
    border: '1px solid #fc8f56', // Brand primaryMild
    titleColor: '#cc5c24', // Brand primaryDeep
    textColor: '#cc5c24', // Brand primaryDeep
  },
  blue: {
    backgroundColor: '#fb732c1a', // Brand primarySubtle
    border: '1px solid #fc8f56', // Brand primaryMild
    titleColor: '#cc5c24', // Brand primaryDeep
    textColor: '#cc5c24', // Brand primaryDeep
  },
  green: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    titleColor: '#065f46',
    textColor: '#064e3b',
  },
  yellow: {
    backgroundColor: '#fb732c1a', // Brand primarySubtle for warnings
    border: '1px solid #fc8f56', // Brand primaryMild
    titleColor: '#cc5c24', // Brand primaryDeep
    textColor: '#cc5c24', // Brand primaryDeep
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
  variant: keyof typeof messageBoxColors = 'primary',
) => ({
  ...emailStyles.messageBox,
  backgroundColor: messageBoxColors[variant].backgroundColor,
  border: messageBoxColors[variant].border,
})

// Helper function to create message title with color
export const createMessageTitle = (
  variant: keyof typeof messageBoxColors = 'primary',
) => ({
  ...emailStyles.messageTitle,
  color: messageBoxColors[variant].titleColor,
})

// Helper function to create message text with color
export const createMessageText = (
  variant: keyof typeof messageBoxColors = 'primary',
) => ({
  ...emailStyles.messageText,
  color: messageBoxColors[variant].textColor,
})

// Made with Bob
