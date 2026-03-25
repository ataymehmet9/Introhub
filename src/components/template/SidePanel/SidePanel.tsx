import classNames from 'classnames'
import { PiGearDuotone } from 'react-icons/pi'
import SidePanelContent from './SidePanelContent'
import type { SidePanelContentProps } from './SidePanelContent'
import type { CommonProps } from '@/@types/common'
import Drawer from '@/components/ui/Drawer'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useThemeStore } from '@/store/themeStore'

type SidePanelProps = SidePanelContentProps & CommonProps

const SidePanel = (props: SidePanelProps) => {
  const { className, ...rest } = props

  const panelExpand = useThemeStore((state) => state.panelExpand)
  const direction = useThemeStore((state) => state.direction)
  const setPanelExpand = useThemeStore((state) => state.setPanelExpand)

  const openPanel = () => {
    setPanelExpand(true)
  }

  const closePanel = () => {
    setPanelExpand(false)

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (document) {
      const bodyClassList = document.body.classList
      if (bodyClassList.contains('drawer-lock-scroll')) {
        bodyClassList.remove('drawer-lock-scroll', 'drawer-open')
      }
    }
  }

  return (
    <>
      <div
        className={classNames('text-2xl', className)}
        onClick={openPanel}
        {...rest}
      >
        <PiGearDuotone />
      </div>
      <Drawer
        title="Theme Config"
        isOpen={panelExpand}
        placement={direction === 'rtl' ? 'left' : 'right'}
        width={375}
        onClose={closePanel}
        onRequestClose={closePanel}
      >
        <SidePanelContent callBackClose={closePanel} />
      </Drawer>
    </>
  )
}

const _SidePanel = withHeaderItem(SidePanel)

export default _SidePanel
