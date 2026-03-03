import type { ThemeConfiguratorProps } from '@/components/template/ThemeConfigurator'
import ThemeConfigurator from '@/components/template/ThemeConfigurator'

export type SidePanelContentProps = ThemeConfiguratorProps

const SidePanelContent = (props: SidePanelContentProps) => {
  return <ThemeConfigurator {...props} />
}

export default SidePanelContent
