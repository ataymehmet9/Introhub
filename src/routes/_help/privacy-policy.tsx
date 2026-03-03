import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useHelpContent } from './-hooks/useHelpContent'
import ArticleBody from './-components/ArticleBody'
import type { ArticleContent } from './-types/Content'

const privacyPolicyContent: ArticleContent = {
  id: 'privacy-policy',
  title: 'Privacy Policy',
  tableOfContents: [
    {
      id: 'information-collection',
      label: 'Information We Collect',
    },
    {
      id: 'how-we-use-information',
      label: 'How We Use Your Information',
    },
    {
      id: 'data-sharing',
      label: 'Data Sharing and Disclosure',
    },
    {
      id: 'data-security',
      label: 'Data Security',
    },
    {
      id: 'your-rights',
      label: 'Your Rights and Choices',
    },
  ],
  sections: [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      content:
        '<p>We collect various types of information to provide and improve our services. This includes personal information you provide directly such as your name, email address, and contact details when you create an account or use our services. We also automatically collect certain information about your device and how you interact with our platform, including IP addresses, browser type, operating system, and usage patterns. Additionally, we may collect information from third-party sources when you choose to connect your account with other services or platforms.</p>',
    },
    {
      id: 'how-we-use-information',
      title: 'How We Use Your Information',
      content:
        '<p>The information we collect is used to provide, maintain, and improve our services. We use your data to personalize your experience, communicate with you about updates and new features, process transactions, and provide customer support. We also analyze usage patterns to understand how our services are being used and to develop new features. Your information helps us ensure the security and integrity of our platform, prevent fraud, and comply with legal obligations. We may also use aggregated, anonymized data for research and analytics purposes.</p>',
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing and Disclosure',
      content:
        '<p>We do not sell your personal information to third parties. We may share your information with trusted service providers who assist us in operating our platform, conducting our business, or servicing you, provided they agree to keep this information confidential. We may also share information when required by law, to protect our rights or property, to prevent fraud or security issues, or in connection with a business transfer such as a merger or acquisition. When you choose to share information publicly through our platform or connect with other users, that information may be visible to others according to your privacy settings.</p>',
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content:
        '<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, regular security assessments, access controls, and employee training on data protection. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security. We encourage you to use strong passwords and to be cautious about sharing sensitive information. In the event of a data breach that affects your personal information, we will notify you in accordance with applicable laws.</p>',
    },
    {
      id: 'your-rights',
      title: 'Your Rights and Choices',
      content:
        '<p>You have certain rights regarding your personal information. You can access, update, or delete your account information at any time through your account settings. You have the right to request a copy of the personal data we hold about you, to request correction of inaccurate data, and to request deletion of your data subject to certain legal exceptions. You can opt out of marketing communications at any time by following the unsubscribe instructions in our emails or adjusting your notification preferences. Depending on your location, you may have additional rights under applicable data protection laws such as GDPR or CCPA. To exercise these rights or if you have questions about our privacy practices, please contact us using the information provided on our website.</p>',
    },
  ],
}

export const Route = createFileRoute('/_help/privacy-policy')({
  component: RouteComponent,
})

function RouteComponent() {
  const { content, setContent } = useHelpContent()

  useEffect(() => {
    setContent(privacyPolicyContent)
  }, [setContent])

  return <ArticleBody content={content} />
}
