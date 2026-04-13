// Shared email styles for IntroHub
// These styles are used across all email templates for consistency
// Using brand colors: primary (#fb732c), primaryDeep (#cc5c24), primaryMild (#fc8f56)

export const emailStyles = {
  // Main container styles
  main: {
    backgroundColor: '#f8f8f9',
    fontFamily:
      'Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif',
    margin: '0',
    padding: '0',
  },

  topContainer: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
  },

  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    width: '640px',
  },

  // Top brand stripe
  topStripe: {
    backgroundColor: '#fb732c',
    height: '4px',
  },

  // Logo section
  logoSection: {
    backgroundColor: '#ffffff',
    padding: '22px 0 25px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #e3e3e3',
  },

  logo: {
    maxWidth: '149px',
    height: 'auto',
  },

  // Spacer
  spacer: {
    backgroundColor: '#f8f8f9',
    padding: '20px 0',
  },

  // Hero section (with image/icon)
  heroSection: {
    backgroundColor: '#ffffff',
    padding: '60px 40px 50px',
    textAlign: 'center' as const,
  },

  heroImage: {
    maxWidth: '352px',
    width: '100%',
    height: 'auto',
  },

  // Main heading
  h1: {
    color: '#2b303a',
    fontSize: '30px',
    fontWeight: 'bold',
    lineHeight: '1.2',
    margin: '50px 0 0',
    textAlign: 'center' as const,
  },

  h2: {
    color: '#2b303a',
    fontSize: '24px',
    fontWeight: 'bold',
    lineHeight: '1.2',
    margin: '30px 0 20px',
    textAlign: 'center' as const,
  },

  // Content area with brand accent
  contentBox: {
    backgroundColor: '#f3fafa',
    border: '30px solid #ffffff',
    padding: '0',
  },

  contentBoxTopStripe: {
    backgroundColor: '#fb732c',
    height: '4px',
  },

  contentBoxInner: {
    padding: '35px 30px 40px',
  },

  // Avatar/Profile image
  avatar: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    margin: '0 auto',
  },

  // Name in content box
  contentName: {
    color: '#2b303a',
    fontSize: '18px',
    fontWeight: 'bold',
    lineHeight: '1.2',
    margin: '15px 0 20px',
    textAlign: 'center' as const,
  },

  // Body text
  text: {
    color: '#2b303a',
    fontSize: '15px',
    lineHeight: '1.5',
    margin: '0 0 15px',
  },

  textSmall: {
    color: '#2b303a',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0',
  },

  // Card styles (for contact info, etc.)
  card: {
    backgroundColor: '#f3fafa',
    borderRadius: '8px',
    padding: '20px 30px',
    margin: '20px 0',
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
    color: '#2b303a',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 4px',
  },

  cardDetail: {
    color: '#2b303a',
    fontSize: '15px',
    margin: '4px 0',
  },

  cardEmail: {
    color: '#fb732c',
    fontSize: '15px',
    margin: '8px 0 0',
  },

  // Message box styles
  messageBox: {
    borderRadius: '8px',
    padding: '20px 30px',
    margin: '20px 0',
  },

  messageTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    margin: '0 0 12px 0',
    padding: '0',
  },

  messageText: {
    fontSize: '15px',
    lineHeight: '22px',
    margin: '0',
    padding: '0',
    whiteSpace: 'normal' as const,
  },

  // Button styles
  buttonContainer: {
    backgroundColor: '#ffffff',
    padding: '40px 10px 60px',
    textAlign: 'center' as const,
  },

  button: {
    backgroundColor: '#fb732c',
    borderRadius: '60px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '15px 30px',
    letterSpacing: 'normal',
  },

  // Link styles
  link: {
    color: '#fb732c',
    textDecoration: 'underline',
  },

  // Spacer between sections
  sectionSpacer: {
    backgroundColor: '#f8f8f9',
    padding: '20px 0',
  },

  // Footer
  footerSection: {
    backgroundColor: '#2b303a',
  },

  footerTopStripe: {
    backgroundColor: '#fb732c',
    height: '4px',
  },

  footerImage: {
    maxWidth: '640px',
    width: '100%',
    height: 'auto',
  },

  footerLogo: {
    maxWidth: '149px',
    height: 'auto',
    margin: '40px auto 0',
  },

  footerSocial: {
    padding: '28px 10px 10px',
    textAlign: 'center' as const,
  },

  footerText: {
    color: '#95979c',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '15px 40px 10px',
  },

  footerDivider: {
    borderTop: '1px solid #555961',
    margin: '25px 40px 10px 40px',
    width: '560px',
  },

  footerCopyright: {
    color: '#95979c',
    fontSize: '12px',
    lineHeight: '1.2',
    margin: '20px 40px 30px',
  },

  // Content section (for backward compatibility)
  content: {
    padding: '0 30px',
  },

  // Divider (for backward compatibility)
  hr: {
    borderColor: '#e5e7eb',
    margin: '32px 0',
  },

  // Footer (for backward compatibility)
  footer: {
    padding: '0 40px',
  },

  footerTextCompat: {
    color: '#95979c',
    fontSize: '12px',
    lineHeight: '1.5',
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

// Message box color variants - using brand colors with new structure
export const messageBoxColors = {
  primary: {
    backgroundColor: '#fff5f0', // Light orange background
    border: '2px solid #fb732c', // Brand primary border
    titleColor: '#cc5c24', // Brand primaryDeep
    textColor: '#2b303a', // Dark text for readability
  },
  blue: {
    backgroundColor: '#fff5f0', // Light orange background
    border: '2px solid #fb732c', // Brand primary border
    titleColor: '#cc5c24', // Brand primaryDeep
    textColor: '#2b303a', // Dark text for readability
  },
  green: {
    backgroundColor: '#ecfdf5',
    border: '2px solid #10b981',
    titleColor: '#065f46',
    textColor: '#2b303a',
  },
  yellow: {
    backgroundColor: '#fff5f0', // Light orange for warnings
    border: '2px solid #fb732c', // Brand primary border
    titleColor: '#cc5c24', // Brand primaryDeep
    textColor: '#2b303a', // Dark text for readability
  },
  gray: {
    backgroundColor: '#f3f4f6',
    border: '2px solid #d1d5db',
    titleColor: '#374151',
    textColor: '#2b303a',
  },
}

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

// Helper function to create header section (kept for backward compatibility)
export const createHeader = (color: string) => ({
  backgroundColor: color,
  padding: '32px 48px',
  textAlign: 'center' as const,
})

// Made with Bob
