import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useHelpContent } from './-hooks/useHelpContent'
import ArticleBody from './-components/ArticleBody'
import type { ArticleContent } from './-types/Content'

const termsConditionsContent: ArticleContent = {
  id: 'terms-and-conditions',
  title: 'Terms and Conditions',
  tableOfContents: [
    {
      id: 'introduction',
      label: 'Introduction',
    },
    {
      id: 'license-to-use-website',
      label: 'License to use website',
    },
    {
      id: 'acceptable-use',
      label: 'Acceptable use',
    },
    {
      id: 'user-content',
      label: 'User content',
    },
    {
      id: 'limitations-of-liability',
      label: 'Limitations of liability',
    },
    {
      id: 'variation',
      label: 'Variation',
    },
  ],
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      content:
        "<p>Welcome to our website. If you continue to browse and use this website, you are agreeing to comply with and be bound by the following terms and conditions of use, which together with our privacy policy govern IntroHub's relationship with you in relation to this website. If you disagree with any part of these terms and conditions, please do not use our website.</p>",
    },
    {
      id: 'license-to-use-website',
      title: 'License to use website',
      content:
        '<p>Unless otherwise stated, IntroHub and/or its licensors own the intellectual property rights in the website and material on the website. Subject to the license below, all these intellectual property rights are reserved.</p>',
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable use',
      content:
        '<p>You must not use this website in any way that causes, or may cause, damage to the website or impairment of the availability or accessibility of the website; or in any way which is unlawful, illegal, fraudulent or harmful, or in connection with any unlawful, illegal, fraudulent or harmful purpose or activity. You must not use this website to copy, store, host, transmit, send, use, publish or distribute any material which consists of (or is linked to) any spyware, computer virus, Trojan horse, worm, keystroke logger, rootkit or other malicious computer software.</p>',
    },
    {
      id: 'user-content',
      title: 'User content',
      content:
        '<p>In these terms and conditions, "your user content" means material (including without limitation text, images, audio material, video material and audio-visual material) that you submit to this website, for whatever purpose. You grant to IntroHub a worldwide, irrevocable, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate and distribute your user content in any existing or future media. You also grant to IntroHub the right to sub-license these rights, and the right to bring an action for infringement of these rights.</p>',
    },
    {
      id: 'limitations-of-liability',
      title: 'Limitations of liability',
      content:
        '<p>IntroHub will not be liable to you (whether under the law of contact, the law of torts or otherwise) in relation to the contents of, or use of, or otherwise in connection with, this website: for any indirect, special or consequential loss; or for any business losses, loss of revenue, income, profits or anticipated savings, loss of contracts or business relationships, loss of reputation or goodwill, or loss or corruption of information or data. These limitations of liability apply even if IntroHub has been expressly advised of the potential loss.</p>',
    },
    {
      id: 'variation',
      title: 'Variation',
      content:
        '<p>IntroHub may revise these terms and conditions from time-to-time. Revised terms and conditions will apply to the use of this website from the date of the publication of the revised terms and conditions on this website. Please check this page regularly to ensure you are familiar with the current version.</p>',
    },
  ],
}

export const Route = createFileRoute(
  '/_authenticated/_help/terms-and-conditions',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { content, setContent } = useHelpContent()

  useEffect(() => {
    setContent(termsConditionsContent)
  }, [setContent])

  return <ArticleBody content={content} />
}
